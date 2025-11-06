import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

serve(() => {
  const body = {
    mixes: [
      {
        title: "冬のチョコミント",
        score: 0.82
      }
    ]
  };

  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
});
