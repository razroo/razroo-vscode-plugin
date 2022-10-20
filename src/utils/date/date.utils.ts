import jwt_decode from "jwt-decode";

/** 
 * isTokenExpired - Determines if idToken is expired
 * Used for triggering token refresh
 */
export function isTokenExpired(idToken: string): boolean {
  let decodedIdToken: any = jwt_decode(idToken);

  if (((decodedIdToken.exp as number) * 1000) - Date.now() <= 0) {
    return true;  
  }
  else {
    return false;
  }
}