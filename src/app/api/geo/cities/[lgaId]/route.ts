
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { lgaId: string } }
) {
    const lgaId = params.lgaId;
    if (!lgaId) {
        return NextResponse.json({ success: false, message: "LGA ID is required." }, { status: 400 });
    }

    // This API doesn't seem to have a direct "get cities by LGA" endpoint.
    // So we fetch all cities and filter them by local_government_id.
    // This is not ideal for performance but is a workaround for the API structure.
    // In a real-world scenario, we'd request a better endpoint or cache this aggressively.
    const url = new URL("https://ngdata.udeh.ng/api/cities-or-towns");
    const apiKey = process.env.NG_DATA_API_KEY;

    if (!apiKey) {
        return NextResponse.json({ success: false, message: "API key is not configured." }, { status: 500 });
    }

    try {
         // The API is paginated, we'd need to loop through all pages for a complete list.
         // For this example, we'll fetch a large number per page to get a decent sample.
         // A more robust solution would handle full pagination.
        url.searchParams.append('limit', '5000');
        
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
        
        const allCities = data.data.cities_or_towns.data;
        
        const filteredCities = allCities.filter((city: any) => 
            city.geoname_adm2code && String(city.geoname_adm2code) === String(lgaId)
        );

        const formattedData = filteredCities.map((city: any) => ({
            id: city.id,
            name: city.name,
            local_government_id: city.geoname_adm2code
        }));
        
        return NextResponse.json({ success: true, data: formattedData });

    } catch (error) {
        console.error(`Failed to fetch cities for LGA ${lgaId}:`, error);
        return NextResponse.json({ success: false, message: "An internal server error occurred." }, { status: 500 });
    }
}
