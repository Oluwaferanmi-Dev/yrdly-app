import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { Resend } from "resend";
import { defineString } from 'firebase-functions/params';

admin.initializeApp();
const db = admin.firestore();

// Define the Resend API key as a secret parameter
const resendApiKey = defineString('RESEND_API_KEY');

// --- New function to send event confirmation email ---
export const onEventRsvp = onDocumentUpdated("posts/{postId}", async (event) => {
    if (!event.data) {
        logger.log("No data associated with the event");
        return;
    }

    const before = event.data.before.data();
    const after = event.data.after.data();

    // Check if the attendees list has changed
    if (before.attendees.length >= after.attendees.length) {
        logger.log("No new attendees, skipping email.");
        return;
    }

    // Find the new attendee
    const newAttendeeId = after.attendees.find((id: string) => !before.attendees.includes(id));
    if (!newAttendeeId) {
        logger.log("Could not determine the new attendee.");
        return;
    }

    // Get the user's email
    const userDoc = await db.collection("users").doc(newAttendeeId).get();
    const userData = userDoc.data();
    if (!userData || !userData.email) {
        logger.log(`User ${newAttendeeId} does not have an email.`);
        return;
    }

    // Add a new document to the mail collection
    await db.collection("mail").add({
        to: userData.email,
        template: {
            name: "eventConfirmation",
            data: {
                eventName: after.title,
                eventDate: after.eventDate,
                eventTime: after.eventTime,
                eventLocation: after.eventLocation?.address,
                eventUrl: `https://yrdly-app.vercel.app/posts/${event.params.postId}`
            }
        }
    });
});


// --- Email Sending Function (Existing) ---
export const processMailQueue = onDocumentCreated("mail/{mailId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.log("No data associated with the event");
        return;
    }
    const mailData = snapshot.data();
    const resend = new Resend(resendApiKey.value());

    try {
        let subject = "";
        let htmlBody = "";

        // Template selection logic
        switch (mailData.template.name) {
            case "eventConfirmation":
                const data = mailData.template.data;
                subject = `🎉 You're attending: ${data.eventName}!`;
                htmlBody = `
                    <h1>Event Confirmation</h1>
                    <p>Hi there,</p>
                    <p>Thanks for RSVPing to <strong>${data.eventName}</strong>. We've added it to your calendar!</p>
                    <ul>
                        <li><strong>Date:</strong> ${data.eventDate}</li>
                        <li><strong>Time:</strong> ${data.eventTime}</li>
                        <li><strong>Location:</strong> ${data.eventLocation}</li>
                    </ul>
                    <p>You can view the event details here: <a href="${data.eventUrl}">${data.eventUrl}</a></p>
                    <p>See you there!</p>
                    <p>- The Yrdly Team</p>
                `;
                break;

            default:
                logger.warn(`Unknown email template: ${mailData.template.name}`);
                // Delete the document to prevent it from being processed again
                await db.collection("mail").doc(event.params.mailId).delete();
                return;
        }

        await resend.emails.send({
            from: 'onboarding@resend.dev', // You must verify this domain in Resend
            to: mailData.to,
            subject: subject,
            html: htmlBody,
        });

        logger.info(`Email sent successfully to ${mailData.to}`);
        // Delete the document from the mail collection after sending
        await db.collection("mail").doc(event.params.mailId).delete();

    } catch (error) {
        logger.error("Error sending email:", error);
    }
});


// --- Callable Functions ---
export const acceptfriendrequest = onCall({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    const { friendRequestId } = request.data;
    const authUser = request.auth;

    if (!authUser) {
        throw new Error("User must be authenticated to accept a friend request.");
    }

    if (!friendRequestId) {
        throw new Error("Friend request ID is required.");
    }

    const friendRequestRef = db.collection("friend_requests").doc(friendRequestId);

    try {
        await db.runTransaction(async (transaction) => {
            const friendRequestDoc = await transaction.get(friendRequestRef);

            if (!friendRequestDoc.exists) {
                throw new Error("Friend request does not exist.");
            }

            const friendRequestData = friendRequestDoc.data();
            if (!friendRequestData) {
                throw new Error("Friend request data is missing.");
            }

            if (friendRequestData.toUserId !== authUser.uid) {
                throw new Error("User is not authorized to accept this friend request.");
            }
            
            if (friendRequestData.status !== 'pending') {
                throw new Error("This friend request is not pending.");
            }

            const fromUserRef = db.collection("users").doc(friendRequestData.fromUserId);
            const toUserRef = db.collection("users").doc(friendRequestData.toUserId);

            // Update friend request status
            transaction.update(friendRequestRef, { status: "accepted" });

            // Add users to each other's friends list
            transaction.update(fromUserRef, { friends: admin.firestore.FieldValue.arrayUnion(friendRequestData.toUserId) });
            transaction.update(toUserRef, { friends: admin.firestore.FieldValue.arrayUnion(friendRequestData.fromUserId) });

            // Create a notification for the user who sent the request
            const notificationRef = db.collection("notifications").doc();
            transaction.set(notificationRef, {
                userId: friendRequestData.fromUserId,
                type: "friend_request_accepted",
                senderId: authUser.uid,
                relatedId: authUser.uid,
                message: `${authUser.token.name || 'Someone'} accepted your friend request.`,
                isRead: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        logger.log(`Friend request ${friendRequestId} accepted.`);
        return { success: true, message: "Friend request accepted." };

    } catch (error) {
        logger.error(`Error accepting friend request ${friendRequestId}:`, error);
        throw new Error("Failed to accept friend request.");
    }
});

export const unfriendUser = onCall({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    // ... (existing code)
});

export const blockUser = onCall({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    // ... (existing code)
});

export const unblockUser = onCall({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    // ... (existing code)
});
