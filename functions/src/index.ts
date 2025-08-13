import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

const db = admin.firestore();

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

        // Create in-app notification
        const notification = {
            userId,
            type,
            senderId,
            relatedId,
            message,
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('notifications').add(notification);

        // Send push notification using the new API
        if (userData.fcmToken) {
            const fcmMessage: admin.messaging.Message = {
                token: userData.fcmToken,
                notification: {
                    title: title,
                    body: message,
                },
                webpush: {
                    fcmOptions: {
                        link: clickAction,
                    },
                },
            };
            await admin.messaging().send(fcmMessage);
        }
    } catch (error) {
        logger.error(`Error sending notification to ${userId}:`, error);
    }
};

export const onfriendrequestcreated = onDocumentCreated("friend_requests/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }
    const request = snapshot.data();
    const fromUserDoc = await db.collection('users').doc(request.fromUserId).get();
    const fromUserData = fromUserDoc.data();
    if (fromUserData) {
        await sendNotification(
            request.toUserId, 'friend_request', request.fromUserId, event.params.requestId,
            `${fromUserData.name} sent you a friend request.`, 'New Friend Request', '/neighbors'
        );
    }
});

export const onfriendrequestaccepted = onDocumentUpdated("friend_requests/{requestId}", async (event) => {
    if (!event.data) return;
    const after = event.data.after.data();
    const before = event.data.before.data();
    if (before?.status === 'pending' && after?.status === 'accepted') {
        const toUserDoc = await db.collection('users').doc(after.toUserId).get();
        const toUserData = toUserDoc.data();
        if (toUserData) {
            await sendNotification(
                after.fromUserId, 'friend_request_accepted', after.toUserId, event.params.requestId,
                `${toUserData.name} accepted your friend request.`, 'Friend Request Accepted', `/users/${after.toUserId}`
            );
        }
    }
});

export const onnewmessage = onDocumentCreated("chats/{chatId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }
    const message = snapshot.data();
    const { authorId, text } = message;
    const { chatId } = event.params;
    const chatDoc = await db.collection('chats').doc(chatId).get();
    const chatData = chatDoc.data();
    if (chatData?.userIds) {
        const recipientId = chatData.userIds.find((id: string) => id !== authorId);
        const authorDoc = await db.collection('users').doc(authorId).get();
        const authorData = authorDoc.data();
        if (recipientId && authorData) {
            await sendNotification(
                recipientId, 'message', authorId, chatId,
                `${authorData.name}: ${text.substring(0, 50)}...`, 'New Message', `/messages?convId=${authorId}`
            );
        }
    }
});

export const onnewpost = onDocumentCreated("posts/{postId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }
    const post = snapshot.data();
    const { authorId, content, location } = post;
    const authorDoc = await db.collection('users').doc(authorId).get();
    const authorData = authorDoc.data();
    if (authorData && location) {
        const usersQuery = await db.collection('users').where('location.lga', '==', location.lga).where('uid', '!=', authorId).get();
        const notifications = usersQuery.docs.map(userDoc =>
            sendNotification(
                userDoc.id, 'post_update', authorId, event.params.postId,
                `${authorData.name} created a new post: "${content.substring(0, 30)}..."`, 'New Post in Your Neighborhood', '/home'
            )
        );
        await Promise.all(notifications);
    }
});

export const onnewcomment = onDocumentCreated("posts/{postId}/comments/{commentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        return;
    }
    const comment = snapshot.data();
    const { authorId, content } = comment;
    const { postId } = event.params;
    const postDoc = await db.collection('posts').doc(postId).get();
    const postData = postDoc.data();
    const authorDoc = await db.collection('users').doc(authorId).get();
    const authorData = authorDoc.data();
    if (postData && authorData && postData.authorId !== authorId) {
        await sendNotification(
            postData.authorId, 'comment', authorId, postId,
            `${authorData.name} commented on your post.`, 'New Comment', `/posts/${postId}`
        );
    }
});

export const onnewlike = onDocumentUpdated("posts/{postId}", async (event) => {
    if (!event.data) return;
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before?.likes.length < after?.likes.length) {
        const newLikerId = after.likes.find((id: string) => !before.likes.includes(id));
        const postAuthorId = after.authorId;
        if (newLikerId && postAuthorId !== newLikerId) {
            const likerDoc = await db.collection('users').doc(newLikerId).get();
            const likerData = likerDoc.data();
            if (likerData) {
                await sendNotification(
                    postAuthorId, 'post_like', newLikerId, event.params.postId,
                    `${likerData.name} liked your post.`, 'New Like', `/posts/${event.params.postId}`
                );
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
            await sendNotification(
                newInviteeId, 'event_invite', eventCreatorId, event.params.eventId,
                `${creatorData.name} invited you to the event: "${after.title}"`, 'New Event Invitation', '/events'
            );
        }
    }
});