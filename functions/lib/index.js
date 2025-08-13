"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptfriendrequest = exports.oneventinvite = exports.onnewlike = exports.onnewcomment = exports.onnewpost = exports.onnewmessage = exports.onfriendrequestaccepted = exports.onfriendrequestcreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
admin.initializeApp();
const db = admin.firestore();
// --- Re-usable notification sender function ---
const sendNotification = async (userId, type, senderId, relatedId, message, title, clickAction) => {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            logger.log(`User ${userId} not found.`);
            return;
        }
        const userData = userDoc.data();
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
            const fcmMessage = {
                token: userData.fcmToken,
                notification: { title, body: message },
                webpush: { fcmOptions: { link: clickAction } },
            };
            await admin.messaging().send(fcmMessage);
        }
    }
    catch (error) {
        logger.error(`Error sending notification to ${userId}:`, error);
    }
};
// --- Notification Triggers ---
exports.onfriendrequestcreated = (0, firestore_1.onDocumentCreated)("friend_requests/{requestId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const request = snapshot.data();
    const fromUserDoc = await db.collection('users').doc(request.fromUserId).get();
    const fromUserData = fromUserDoc.data();
    if (fromUserData) {
        await sendNotification(request.toUserId, 'friend_request', request.fromUserId, event.params.requestId, `${fromUserData.name} sent you a friend request.`, 'New Friend Request', '/neighbors');
    }
});
exports.onfriendrequestaccepted = (0, firestore_1.onDocumentUpdated)("friend_requests/{requestId}", async (event) => {
    if (!event.data)
        return;
    const after = event.data.after.data();
    const before = event.data.before.data();
    if ((before === null || before === void 0 ? void 0 : before.status) === 'pending' && (after === null || after === void 0 ? void 0 : after.status) === 'accepted') {
        const toUserDoc = await db.collection('users').doc(after.toUserId).get();
        const toUserData = toUserDoc.data();
        if (toUserData) {
            await sendNotification(after.fromUserId, 'friend_request_accepted', after.toUserId, event.params.requestId, `${toUserData.name} accepted your friend request.`, 'Friend Request Accepted', `/users/${after.toUserId}`);
        }
    }
});
// ... (other notification functions remain the same) ...
exports.onnewmessage = (0, firestore_1.onDocumentCreated)("chats/{chatId}/messages/{messageId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const message = snapshot.data();
    const { authorId, text } = message;
    const { chatId } = event.params;
    const chatDoc = await db.collection('chats').doc(chatId).get();
    const chatData = chatDoc.data();
    if (chatData === null || chatData === void 0 ? void 0 : chatData.userIds) {
        const recipientId = chatData.userIds.find((id) => id !== authorId);
        const authorDoc = await db.collection('users').doc(authorId).get();
        const authorData = authorDoc.data();
        if (recipientId && authorData) {
            await sendNotification(recipientId, 'message', authorId, chatId, `${authorData.name}: ${text.substring(0, 50)}...`, 'New Message', `/messages?convId=${authorId}`);
        }
    }
});
exports.onnewpost = (0, firestore_1.onDocumentCreated)("posts/{postId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const post = snapshot.data();
    const { authorId, content, location } = post;
    const authorDoc = await db.collection('users').doc(authorId).get();
    const authorData = authorDoc.data();
    if (authorData && location) {
        const usersQuery = await db.collection('users').where('location.lga', '==', location.lga).where('uid', '!=', authorId).get();
        const notifications = usersQuery.docs.map(userDoc => sendNotification(userDoc.id, 'post_update', authorId, event.params.postId, `${authorData.name} created a new post: "${content.substring(0, 30)}..."`, 'New Post in Your Neighborhood', '/home'));
        await Promise.all(notifications);
    }
});
exports.onnewcomment = (0, firestore_1.onDocumentCreated)("posts/{postId}/comments/{commentId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
    const comment = snapshot.data();
    const { authorId } = comment;
    const { postId } = event.params;
    const postDoc = await db.collection('posts').doc(postId).get();
    const postData = postDoc.data();
    const authorDoc = await db.collection('users').doc(authorId).get();
    const authorData = authorDoc.data();
    if (postData && authorData && postData.authorId !== authorId) {
        await sendNotification(postData.authorId, 'comment', authorId, postId, `${authorData.name} commented on your post.`, 'New Comment', `/posts/${postId}`);
    }
});
exports.onnewlike = (0, firestore_1.onDocumentUpdated)("posts/{postId}", async (event) => {
    if (!event.data)
        return;
    const before = event.data.before.data();
    const after = event.data.after.data();
    if ((before === null || before === void 0 ? void 0 : before.likes.length) < (after === null || after === void 0 ? void 0 : after.likes.length)) {
        const newLikerId = after.likes.find((id) => !before.likes.includes(id));
        const postAuthorId = after.authorId;
        if (newLikerId && postAuthorId !== newLikerId) {
            const likerDoc = await db.collection('users').doc(newLikerId).get();
            const likerData = likerDoc.data();
            if (likerData) {
                await sendNotification(postAuthorId, 'post_like', newLikerId, event.params.postId, `${likerData.name} liked your post.`, 'New Like', `/posts/${event.params.postId}`);
            }
        }
    }
});
exports.oneventinvite = (0, firestore_1.onDocumentUpdated)("events/{eventId}", async (event) => {
    if (!event.data)
        return;
    const before = event.data.before.data();
    const after = event.data.after.data();
    if ((before === null || before === void 0 ? void 0 : before.invited.length) < (after === null || after === void 0 ? void 0 : after.invited.length)) {
        const newInviteeId = after.invited.find((id) => !before.invited.includes(id));
        const eventCreatorId = after.authorId;
        const creatorDoc = await db.collection('users').doc(eventCreatorId).get();
        const creatorData = creatorDoc.data();
        if (newInviteeId && creatorData) {
            await sendNotification(newInviteeId, 'event_invite', eventCreatorId, event.params.eventId, `${creatorData.name} invited you to the event: "${after.title}"`, 'New Event Invitation', '/events');
        }
    }
});
// --- Callable function for accepting friend requests ---
exports.acceptfriendrequest = (0, https_1.onCall)(async (request) => {
    var _a;
    const uid = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const { friendRequestId } = request.data;
    if (!friendRequestId) {
        throw new https_1.HttpsError('invalid-argument', 'The function must be called with a "friendRequestId".');
    }
    const friendRequestRef = db.collection('friend_requests').doc(friendRequestId);
    try {
        await db.runTransaction(async (transaction) => {
            const friendRequestDoc = await transaction.get(friendRequestRef);
            if (!friendRequestDoc.exists) {
                throw new https_1.HttpsError('not-found', 'The specified friend request does not exist.');
            }
            const friendRequest = friendRequestDoc.data();
            if (friendRequest.toUserId !== uid) {
                throw new https_1.HttpsError('permission-denied', 'You are not authorized to accept this request.');
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
            transaction.update(friendRequestRef, { status: 'accepted' });
            transaction.update(fromUserRef, { friends: admin.firestore.FieldValue.arrayUnion(toUserId) });
            transaction.update(toUserRef, { friends: admin.firestore.FieldValue.arrayUnion(fromUserId) });
        });
        logger.log(`Successfully accepted friend request ${friendRequestId}`);
        return { success: true };
    }
    catch (error) {
        logger.error(`Error accepting friend request ${friendRequestId}:`, error);
        // Re-throw HttpsError or convert other errors
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'An unexpected error occurred.');
    }
});
//# sourceMappingURL=index.js.map