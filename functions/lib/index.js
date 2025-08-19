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
exports.unblockUser = exports.blockUser = exports.unfriendUser = exports.acceptfriendrequest = exports.processMailQueue = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const resend_1 = require("resend");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const db = admin.firestore();
// Define the Resend API key as a secret parameter
const resendApiKey = (0, params_1.defineString)('RESEND_API_KEY');
// --- Re-usable notification sender function ---
const sendNotification = async (userId, type, senderId, relatedId, message, title, clickAction) => {
    // ... (existing code)
};
// --- Notification Triggers ---
// ... (existing code)
// --- Email Sending Function (New) ---
exports.processMailQueue = (0, firestore_1.onDocumentCreated)("mail/{mailId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        logger.log("No data associated with the event");
        return;
    }
    const mailData = snapshot.data();
    const resend = new resend_1.Resend(resendApiKey.value());
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
    }
    catch (error) {
        logger.error("Error sending email:", error);
    }
});
// --- Callable Functions ---
exports.acceptfriendrequest = (0, https_1.onCall)({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    // ... (existing code)
});
exports.unfriendUser = (0, https_1.onCall)({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    // ... (existing code)
});
exports.blockUser = (0, https_1.onCall)({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    // ... (existing code)
});
exports.unblockUser = (0, https_1.onCall)({ cors: ["https://yrdly-app.vercel.app", "http://localhost:9002"] }, async (request) => {
    // ... (existing code)
});
//# sourceMappingURL=index.js.map