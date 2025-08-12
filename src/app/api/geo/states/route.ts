
import { NextResponse } from 'next/server';

export async function GET() {
    const url = new URL("https://ngdata.udeh.ng/api/states");
    const apiKey = process.env.NG_DATA_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ success: false, message: "API key is not configured." }, { status: 500 });
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            next: { revalidate: 3600 * 24 } // Cache for 24 hours
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Geo API Error:", errorText);
            return NextResponse.json({ success: false, message: `API request failed with status ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        const formattedData = data.data.states.data.map((state: any) => ({
            id: state._id,
            name: state.name
        }));
        
        return NextResponse.json({ success: true, data: formattedData });

    } catch (error) {
        console.error("Failed to fetch states:", error);
        return NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 });
    }
}
