export async function onRequestGet({ request, env }) {
  const params = new URL(request.url).searchParams;
  const number = params.get("number")?.trim();

  if (!number) {
    return Response.json({ error: "Не указан артикул" }, { status: 400 });
  }

  if (!env.FAVORIT_API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const url = new URL("http://api.favorit-parts.ru/hs/hsprice/");

  url.searchParams.set("key", env.FAVORIT_API_KEY);
  url.searchParams.set("number", number);

  const brand = params.get("brand");

  if (brand) {
    url.searchParams.set("brand", brand);

    if (params.get("analogues") === "on") {
      url.searchParams.set("analogues", "on");
    }
  }

  try {
    const response = await fetch(url.toString());

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Сервис временно недоступен" },
      { status: 502 },
    );
  }
}
