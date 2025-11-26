export const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = document.cookie
      ?.split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
    return value ? decodeURIComponent(value) : null;
}

export const removeCookie = (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const handleUnauthorized = () => {
    if (typeof window === "undefined") return;
    
    removeCookie("huce_access_token");
    removeCookie("huce_email");
    removeCookie("huce_expires_in");
    removeCookie("huce_role");
    removeCookie("huce_user_id");
    
    window.location.href = "/login";
}