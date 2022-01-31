import axios from "axios";

export const getMockIdToken = () => {
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaWNrbmFtZSI6ImZlZGU5NjEyIiwibmFtZSI6ImZlZGVyaWNvZmVycmV5cmEyQGdtYWlsLmNvbSIsInBpY3R1cmUiOiJodHRwczovL2F2YXRhcnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMzI4MDUzNjk_dj00IiwidXBkYXRlZF9hdCI6IjIwMjEtMTAtMTJUMjM6MTE6NDcuNDgxWiIsImVtYWlsIjoiZmVkZXJpY29mZXJyZXlyYTJAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImlzcyI6Imh0dHBzOi8vaWQucmF6cm9vLmNvbS8iLCJzdWIiOiJnaXRodWJ8MzI4MDUzNjkiLCJhdWQiOiJBMHRMUllZZnlHR3R3eUM0b2RWaDUwam1VWktXOGJWSiIsImlhdCI6MTYzNDMyODg2OSwiZXhwIjo5OTM0MzY0ODY5LCJub25jZSI6ImFuUkxZV2hEVXpsellsRlRTREV5VFVoQlVIbExiMXAzU25kTWQwcGhSRzlEVEVWTVoyOUpSakZFYkVOdCJ9.yhGnUz7KBQRj_YpjZP5ZOHAUdKhvQpuHKzCP5C0IabE'
}

export const getVsCodeAuthenticationMock = () => {
    return {
        "vsCodeInstanceId": "instance_to_testing",
        "userId": "test",
        "privateDirectories": "test",
        "refreshToken": "test" 
    };
};

export const mockAxios = axios.create({
    baseURL: "https://localhost:5000/"
});
  