export const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = document.cookie
      ?.split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1];
    return value ? decodeURIComponent(value) : null;
}