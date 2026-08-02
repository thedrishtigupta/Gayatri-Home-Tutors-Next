// export async function adminFetch(input, init = {}) {
//   const response = await fetch(input, {
//     credentials: "same-origin",
//     ...init,
//   });

//   if (response.status === 401 && typeof window !== "undefined") {
//     window.location.href = "/admin/login";
//   }

//   return response;
// }

export async function adminFetch(input, init = {}) {
  const response = await fetch(input, {
    credentials: "same-origin",
    ...init,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/admin/login";
  }

  return response;
}

/**
 * adminFetch + safe JSON parsing.
 *
 * A failing API route can answer with an empty body or an HTML error page;
 * calling `res.json()` on that throws a SyntaxError that takes the whole
 * admin page down. This always resolves to { ok, status, data, error }.
 *
 * @param {RequestInfo} input
 * @param {RequestInit} [init]
 * @param {any} [fallback] value used for `data` when the response has no usable JSON
 */
export async function adminJson(input, init = {}, fallback = null) {
  let response;
  try {
    response = await adminFetch(input, init);
  } catch (err) {
    return { ok: false, status: 0, data: fallback, error: err.message || "Network error" };
  }

  let data = fallback;
  let parsed = false;
  const text = await response.text().catch(() => "");
  if (text) {
    try { data = JSON.parse(text); parsed = true; } catch { /* not JSON — keep fallback */ }
  }

  if (!response.ok) {
    return {
      ok:     false,
      status: response.status,
      data:   fallback,
      error:  (parsed && data && data.error) || `Request failed (${response.status})`,
    };
  }

  return { ok: true, status: response.status, data, error: null };
}