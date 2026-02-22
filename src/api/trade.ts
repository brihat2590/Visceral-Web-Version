
const BASE_URL =process.env.NEXT_PUBLIC_BASE_URL;
type TradePayload = {
    user_id: string;
    symbol: string;
    region: string;
    quantity: number;
  };
  
  export async function buyStock(payload: TradePayload) {
    const res = await fetch(`${BASE_URL}/buy?user_id=${payload.user_id}&region=${payload.region}&quantity=${payload.quantity}&symbol=${payload.symbol}`, {
      method: "POST",
     
      
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Buy failed");
    }
  
    return res.json();
  }
  
  export async function sellStock(payload: TradePayload) {
    const res = await fetch(`${BASE_URL}/sell?user_id=${payload.user_id}&region=${payload.region}&symbol=${payload.symbol}&quantity=${payload.quantity}`, {
      method: "POST",
      
      
    });
  
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Sell failed");
    }
  
    return res.json();
  }

  