
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

const db = admin.firestore();

// --- Re-usable notification sender function ---
const sendNotification = async (userId: string, type: string, senderId: string, relatedId: string, message: string, title: string, clickAction: string) => {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            logger.log(`User ${userId} not found.`);
            return;
        }
        const userData = userDoc.data()!;

        const notificationSettings = userData.notificationSettings || {};
        const typeKey = type.split('_')[0] + 's';
        if (notificationSettings[typeKey] === false) {
            logger.log(`User ${userId} has disabled ${type} notifications.`);
            return;
        }

        const notification = {
            userId, type, senderId, relatedId, message, isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('notifications').add(notification);

        if (userData.fcmToken) {
            const fcmMessage: admin.messaging.Message = {
                token: userData.fcmToken,
                notification: { title, body: message },
                webpush: { fcmOptions: { link: clickAction } },
            };
            await admin.messaging().send(fcmMessage);
        }
    } catch (error) {
        logger.error(`Error sending notification to ${userId}:`, error);
    }
};

// --- Notification Triggers ---

export const onfriendrequestcreated = onDocumentCreated("friend_requests/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const request = snapshot.data();
    const fromUserDoc = await db.collection('users').doc(request.fromUserId).get();
    const fromUserData = fromUserDoc.data();
    if (fromUserData) {
        await sendNotification(request.toUserId, 'friend_request', request.fromUserId, event.params.requestId, `${fromUserData.name} sent you a friend request.`, 'New Friend Request', '/neighbors');
    }
});

// onfriendrequestaccepted is now handled inside the acceptfriendrequest callable function to ensure transactional integrity.

// ... (other notification functions remain the same) ...
export const onnewmessage = onDocumentCreated("conversations/{conversationId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const message = snapshot.data();
    const { senderId, text } = message;
    const { conversationId } = event.params;
    const chatDoc = await db.collection('conversations').doc(conversationId).get();
    const chatData = chatDoc.data();
    if (chatData?.participantIds) {
        const recipientId = chatData.participantIds.find((id: string) => id !== senderId);
        const authorDoc = await db.collection('users').doc(senderId).get();
        const authorData = authorDoc.data();
        if (recipientId && authorData) {
            await sendNotification(recipientId, 'message', senderId, conversationId, `${authorData.name}: ${text.substring(0, 50)}...`, 'New Message', `/messages?convId=${senderId}`);
        }
    }
});

export const onnewpost = onDocumentCreated("posts/{postId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const post = snapshot.data();
    const { userId, text, location } = post;
    const authorDoc = await db.collection('users').doc(userId).get();
    const authorData = authorDoc.data();
    if (authorData && location) {
        const usersQuery = await db.collection('users').where('location.lga', '==', location.lga).where('uid', '!=', userId).get();
        const notifications = usersQuery.docs.map(userDoc =>
            sendNotification(userDoc.id, 'post_update', userId, event.params.postId, `${authorData.name} created a new post: "${text.substring(0, 30)}..."`, 'New Post in Your Neighborhood', '/home')
        );
        await Promise.all(notifications);
    }
});

export const onnewcomment = onDocumentCreated("posts/{postId}/comments/{commentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const comment = snapshot.data();
    const { userId } = comment;
    const { postId } = event.params;
    const postDoc = await db.collection('posts').doc(postId).get();
    const postData = postDoc.data();
    const authorDoc = await db.collection('users').doc(userId).get();
    const authorData = authorDoc.data();
    if (postData && authorData && postData.userId !== userId) {
        await sendNotification(postData.userId, 'comment', userId, postId, `${authorData.name} commented on your post.`, 'New Comment', `/posts/${postId}`);
    }
});

export const onnewlike = onDocumentUpdated("posts/{postId}", async (event) => {
    if (!event.data) return;
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before?.likedBy.length < after?.likedBy.length) {
        const newLikerId = after.likedBy.find((id: string) => !before.likedBy.includes(id));
        const postAuthorId = after.userId;
        if (newLikerId && postAuthorId !== newLikerId) {
            const likerDoc = await db.collection('users').doc(newLikerId).get();
            const likerData = likerDoc.data();
            if (likerData) {
                await sendNotification(postAuthorId, 'post_like', newLikerId, event.params.postId, `${likerData.name} liked your post.`, 'New Like', `/posts/${event.params.postId}`);
            }
        }
    }
});

export const oneventinvite = onDocumentUpdated("events/{eventId}", async (event) => {
    if (!event.data) return;
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before?.invited.length < after?.invited.length) {
        const newInviteeId = after.invited.find((id: string) => !before.invited.includes(id));
        const eventCreatorId = after.authorId;
        const creatorDoc = await db.collection('users').doc(eventCreatorId).get();
        const creatorData = creatorDoc.data();
        if (newInviteeId && creatorData) {
            await sendNotification(newInviteeId, 'event_invite', eventCreatorId, event.params.eventId, `${creatorData.name} invited you to the event: "${after.title}"`, 'New Event Invitation', '/events');
        }
    }
});


// --- Callable function for accepting friend requests ---
export const acceptfriendrequest = onCall(async (request) => {
    const uid = request.auth?.uid;
    if (!uid) {
        throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { friendRequestId } = request.data;
    if (!friendRequestId) {
        throw new HttpsError('invalid-argument', 'The function must be called with a "friendRequestId".');
    }

    const friendRequestRef = db.collection('friend_requests').doc(friendRequestId);
    let fromUserData: admin.firestore.DocumentData | undefined;

    try {
        await db.runTransaction(async (transaction) => {
            const friendRequestDoc = await transaction.get(friendRequestRef);

            if (!friendRequestDoc.exists) {
                throw new HttpsError('not-found', 'The specified friend request does not exist.');
            }

            const friendRequest = friendRequestDoc.data()!;

            if (friendRequest.toUserId !== uid) {
                throw new HttpsError('permission-denied', 'You are not authorized to accept this request.');
            }
            
            if (friendRequest.status !== 'pending') {
                // No need to throw an error, just log and exit gracefully.
                logger.log(`Request ${friendRequestId} is already ${friendRequest.status}.`);
                return;
            }

            const fromUserId = friendRequest.fromUserId;
            const toUserId = friendRequest.toUserId;

            const fromUserRef = db.collection('users').doc(fromUserId);
            const toUserRef = db.collection('users').doc(toUserId);

            // Get user data for notification before committing transaction
            const toUserDoc = await transaction.get(toUserRef);
            fromUserData = toUserDoc.data();

            transaction.update(friendRequestRef, { status: 'accepted' });
            transaction.update(fromUserRef, { friends: admin.firestore.FieldValue.arrayUnion(toUserId) });
            transaction.update(toUserRef, { friends: admin.firestore.FieldValue.arrayUnion(fromUserId) });
        });

        const friendRequest = (await friendRequestRef.get()).data()!;
        if (fromUserData) {
             await sendNotification(
                friendRequest.fromUserId, 
                'friend_request_accepted', 
                friendRequest.toUserId, 
                friendRequestId, 
                `${fromUserData.name} accepted your friend request.`, 
                'Friend Request Accepted', 
                `/users/${friendRequest.toUserId}`
            );
        }

        logger.log(`Successfully accepted friend request ${friendRequestId}`);
        return { success: true };

    } catch (error) {
        logger.error(`Error accepting friend request ${friendRequestId}:`, error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError('internal', 'An unexpected error occurred.');
    }
});
