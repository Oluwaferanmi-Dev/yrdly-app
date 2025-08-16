
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { User, FriendRequest } from '@/types';

type FriendshipStatus = 'friends' | 'request_sent' | 'request_received' | 'none';

export const getFriendshipStatus = async (currentUser: User, targetUser: User): Promise<FriendshipStatus> => {
    if (currentUser.friends?.includes(targetUser.uid)) {
        return 'friends';
    }

    const requestsQuery = query(
        collection(db, "friend_requests"),
        where("participantIds", "in", [[currentUser.uid, targetUser.uid], [targetUser.uid, currentUser.uid]]),
        where("status", "==", "pending")
    );

    const querySnapshot = await getDocs(requestsQuery);

    if (!querySnapshot.empty) {
        const request = querySnapshot.docs[0].data() as FriendRequest;
        return request.fromUserId === currentUser.uid ? 'request_sent' : 'request_received';
    }

    return 'none';
};
