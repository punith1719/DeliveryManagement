import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface D365TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RequestBody {
  salesid: string;
}

async function getD365AccessToken(): Promise<string> {
  const tenantId = Deno.env.get("D365_TENANT_ID");
  const clientId = Deno.env.get("D365_CLIENT_ID");
  const clientSecret = Deno.env.get("D365_CLIENT_SECRET");
  const resource = Deno.env.get("D365_RESOURCE");

  if (!tenantId || !clientId || !clientSecret || !resource) {
    throw new Error("Missing D365 configuration in environment variables");
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/token`;
  
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("resource", resource);

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get D365 access token: ${error}`);
  }

  const data: D365TokenResponse = await response.json();
  return data.access_token;
}

async function updateSalesOrderStatus(salesId: string, accessToken: string): Promise<void> {
  const d365Url = Deno.env.get("D365_FO_URL");
  
  if (!d365Url) {
    throw new Error("Missing D365_FO_URL in environment variables");
  }

  const endpoint = `${d365Url}/data/SalesOrders`;
  
  const updatePayload = {
    SalesOrderNumber: salesId,
    DeliveryStatus: "Delivered",
  };

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "OData-MaxVersion": "4.0",
      "OData-Version": "4.0",
    },
    body: JSON.stringify(updatePayload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update D365 sales order: ${error}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { salesid }: RequestBody = await req.json();

    if (!salesid) {
      return new Response(
        JSON.stringify({ error: "salesid is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const accessToken = await getD365AccessToken();
    await updateSalesOrderStatus(salesid, accessToken);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Sales order status updated successfully in D365",
        salesid 
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error updating D365 status:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});