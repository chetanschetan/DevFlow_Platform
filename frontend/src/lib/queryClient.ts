// // import { QueryClient, QueryFunction } from "@tanstack/react-query";

// // // --- 1. CONFIGURATION ---
// // // We use a fallback to Port 443 to match your backend's current running state
// // const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:443';

// // async function throwIfResNotOk(res: Response) {
// //   if (!res.ok) {
// //     // Attempt to get error message from JSON, fallback to status text
// //     let errorMessage = res.statusText;
// //     try {
// //       const data = await res.json();
// //       errorMessage = data.error || data.message || res.statusText;
// //     } catch (e) {
// //       // If not JSON, use raw text
// //     }
// //     throw new Error(`${res.status}: ${errorMessage}`);
// //   }
// // }

// // // --- 2. THE API REQUEST UTILITY ---
// // export async function apiRequest(
// //   method: string,
// //   url: string,
// //   data?: unknown | undefined,
// // ): Promise<Response> {
// //   const token = localStorage.getItem('token');
// //   const headers: Record<string, string> = {};
  
// //   if (data) {
// //     headers["Content-Type"] = "application/json";
// //   }
  
// //   if (token) {
// //     headers["Authorization"] = `Bearer ${token}`;
// //   }

// //   // Construct Full URL: Ensures frontend (5173) talks to backend (443)
// //   const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

// //   const res = await fetch(fullUrl, {
// //     method,
// //     headers,
// //     body: data ? JSON.stringify(data) : undefined,
// //     credentials: "include",
// //   });

// //   await throwIfResNotOk(res);
// //   return res;
// // }

// // // --- 3. THE REACT QUERY FUNCTION ---
// // type UnauthorizedBehavior = "returnNull" | "throw";

// // export const getQueryFn: <T>(options: {
// //   on401: UnauthorizedBehavior;
// // }) => QueryFunction<T> =
// //   ({ on401: unauthorizedBehavior }) =>
// //   async ({ queryKey }) => {
// //     const token = localStorage.getItem('token');
// //     const headers: Record<string, string> = {};
    
// //     if (token) {
// //       headers["Authorization"] = `Bearer ${token}`;
// //     }

// //     // Join queryKey parts and prepend BASE_URL
// //     const path = queryKey.join("/");
// //     const fullUrl = path.startsWith('http') ? path : `${BASE_URL}/${path}`.replace(/\/+/g, '/').replace(':/', '://');

// //     const res = await fetch(fullUrl, {
// //       headers,
// //       credentials: "include",
// //     });

// //     if (unauthorizedBehavior === "returnNull" && res.status === 401) {
// //       return null as any;
// //     }

// //     await throwIfResNotOk(res);
// //     return await res.json();
// //   };

// // // --- 4. THE QUERY CLIENT INSTANCE ---
// // export const queryClient = new QueryClient({
// //   defaultOptions: {
// //     queries: {
// //       queryFn: getQueryFn({ on401: "throw" }),
// //       refetchInterval: false,
// //       refetchOnWindowFocus: false,
// //       staleTime: Infinity, // Critical for coding: don't refresh while student is typing
// //       retry: false,
// //     },
// //     mutations: {
// //       retry: false,
// //     },
// //   },
// // });


// import { QueryClient, QueryFunction } from "@tanstack/react-query";

// // --- 1. CONFIGURATION ---
// /**
//  * BEST PRACTICE: Use an empty string for BASE_URL if using Vite Proxy.
//  * This prevents "http://localhost:3000/api/api/..." path doubling.
//  * If you are NOT using a proxy, set this to 'http://localhost:3000'
//  */
// const BASE_URL = (import.meta as any).env?.VITE_API_URL || "";

// async function throwIfResNotOk(res: Response) {
//   if (!res.ok) {
//     const resClone = res.clone();
//     let errorMessage = res.statusText;
    
//     try {
//       const data = await resClone.json();
//       errorMessage = data.error || data.message || res.statusText;
//     } catch (e) {
//       // Fallback for non-JSON error responses
//     }
    
//     throw new Error(`${res.status}: ${errorMessage}`);
//   }
// }

// // --- 2. THE API REQUEST UTILITY ---
// export async function apiRequest(
//   method: string,
//   url: string,
//   data?: unknown | undefined,
// ): Promise<Response> {
//   const token = localStorage.getItem('token');
//   const headers: Record<string, string> = {};
  
//   if (data) {
//     headers["Content-Type"] = "application/json";
//   }
  
//   if (token) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }

//   // FIX: Robust URL construction to avoid //api/api overlaps
//   let targetUrl = url;
//   if (!url.startsWith('http')) {
//     // If url starts with / and BASE_URL ends with / (or is empty), prevent double slashes
//     const cleanPath = url.startsWith('/') ? url : `/${url}`;
//     targetUrl = `${BASE_URL}${cleanPath}`.replace(/\/+/g, '/').replace(':/', '://');
//   }

//   const res = await fetch(targetUrl, {
//     method,
//     headers,
//     body: data ? JSON.stringify(data) : undefined,
//     /**
//      * Since you are using JWT (Authorization Header), use "omit". 
//      * "include" triggers strict CORS checks that often fail with wildcard backends.
//      */
//     credentials: "omit", 
//   });

//   await throwIfResNotOk(res);
//   return res;
// }

// // --- 3. THE REACT QUERY FUNCTION ---
// type UnauthorizedBehavior = "returnNull" | "throw";

// export const getQueryFn: <T>(options: {
//   on401: UnauthorizedBehavior;
// }) => QueryFunction<T> =
//   ({ on401: unauthorizedBehavior }) =>
//   async ({ queryKey }) => {
//     const token = localStorage.getItem('token');
//     const headers: Record<string, string> = {};
    
//     if (token) {
//       headers["Authorization"] = `Bearer ${token}`;
//     }

//     // Standardize the path joining from queryKey array
//     const path = queryKey.join("/");
//     const cleanPath = path.startsWith('/') ? path : `/${path}`;
//     const fullUrl = path.startsWith('http') 
//       ? path 
//       : `${BASE_URL}${cleanPath}`.replace(/\/+/g, '/').replace(':/', '://');

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

// // --- 4. THE QUERY CLIENT INSTANCE ---
// export const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       queryFn: getQueryFn({ on401: "throw" }),
//       refetchInterval: false,
//       refetchOnWindowFocus: false,
//       // Prevents the editor from resetting while the student is solving
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
 * Set to "" to use the Vite Proxy (Recommended for Dev)
 * Set to "http://localhost:3000" if you are not using a proxy.
 */
const BASE_URL = ""; 

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

  // FIX: DEFENSIVE URL BUILDING
  // 1. If it's already a full URL, use it.
  // 2. If BASE_URL is empty, just use the provided url.
  // 3. Otherwise, join them and collapse any double slashes (e.g., //api//api -> /api)
  let targetUrl = url;
  if (!url.startsWith('http')) {
    targetUrl = `${BASE_URL}/${url}`.replace(/\/+/g, '/').replace(':/', '://');
  }

  const res = await fetch(targetUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "omit", // Using 'omit' because we use Manual Bearer Tokens
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
      : `${BASE_URL}/${path}`.replace(/\/+/g, '/').replace(':/', '://');

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