// import { QueryClient, QueryFunction } from "@tanstack/react-query";

// /** * CONFIGURATION: 
//  * Set to "" to use the Vite Proxy (Recommended for Dev)
//  * Set to "http://localhost:3000" if you are not using a proxy.
//  */
// const BASE_URL = ""; 

// async function throwIfResNotOk(res: Response) {
//   if (!res.ok) {
//     const resClone = res.clone();
//     let errorMessage = res.statusText;
//     try {
//       const data = await resClone.json();
//       errorMessage = data.error || data.message || res.statusText;
//     } catch (e) {
//       // Fallback for non-JSON
//     }
//     throw new Error(`${res.status}: ${errorMessage}`);
//   }
// }

// export async function apiRequest(
//   method: string,
//   url: string,
//   data?: unknown | undefined,
// ): Promise<Response> {
//   const token = localStorage.getItem('token');
//   const headers: Record<string, string> = {};
  
//   if (data) headers["Content-Type"] = "application/json";
//   if (token) headers["Authorization"] = `Bearer ${token}`;

//   // FIX: DEFENSIVE URL BUILDING
//   // 1. If it's already a full URL, use it.
//   // 2. If BASE_URL is empty, just use the provided url.
//   // 3. Otherwise, join them and collapse any double slashes (e.g., //api//api -> /api)
//   let targetUrl = url;
//   if (!url.startsWith('http')) {
//     targetUrl = `${BASE_URL}/${url}`.replace(/\/+/g, '/').replace(':/', '://');
//   }

//   const res = await fetch(targetUrl, {
//     method,
//     headers,
//     body: data ? JSON.stringify(data) : undefined,
//     credentials: "omit", // Using 'omit' because we use Manual Bearer Tokens
//   });

//   await throwIfResNotOk(res);
//   return res;
// }

// export const getQueryFn: <T>(options: {
//   on401: "returnNull" | "throw";
// }) => QueryFunction<T> =
//   ({ on401: unauthorizedBehavior }) =>
//   async ({ queryKey }) => {
//     const token = localStorage.getItem('token');
//     const headers: Record<string, string> = {};
//     if (token) headers["Authorization"] = `Bearer ${token}`;

//     const path = queryKey.join("/");
//     const fullUrl = path.startsWith('http') 
//       ? path 
//       : `${BASE_URL}/${path}`.replace(/\/+/g, '/').replace(':/', '://');

//     const res = await fetch(fullUrl, {
//       headers,
//       credentials: "omit",
//     });

//     if (unauthorizedBehavior === "returnNull" && res.status === 401) {
//       return null as any;
//     }

//     await throwIfResNotOk(res);
//     return await res.json();
//   };

// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       queryFn: getQueryFn({ on401: "throw" }),
//       refetchInterval: false,
//       refetchOnWindowFocus: false,
//       staleTime: Infinity, 
//       retry: false,
//     },
//     mutations: {
//       retry: false,
//     },
//   },
// });


import { QueryClient, QueryFunction } from "@tanstack/react-query";

/** * CONFIGURATION: 
 * We now use the Environment Variable from Vercel.
 * If VITE_API_URL is not set, it defaults to an empty string (using relative paths).
 */
const BASE_URL = import.meta.env.VITE_API_URL || ""; 

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const resClone = res.clone();
    let errorMessage = res.statusText;
    try {
      const data = await resClone.json();
      errorMessage = data.error || data.message || res.statusText;
    } catch (e) {
      // Fallback for non-JSON
    }
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (data) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // DEFENSIVE URL BUILDING
  let targetUrl = url;
  if (!url.startsWith('http')) {
    // This joins the Render URL + the path and fixes slash issues
    targetUrl = `${BASE_URL}/${url}`.replace(/([^:]\/)\/+/g, "$1");
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    // Keep 'omit' since you are using Manual Bearer Tokens (localStorage)
    credentials: "omit", 
  });

  await throwIfResNotOk(res);
  return res;
}

export const getQueryFn: <T>(options: {
  on401: "returnNull" | "throw";
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const path = queryKey.join("/");
    const fullUrl = path.startsWith('http') 
      ? path 
      : `${BASE_URL}/${path}`.replace(/([^:]\/)\/+/g, "$1");

    const res = await fetch(fullUrl, {
      headers,
      credentials: "omit",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null as any;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity, 
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});