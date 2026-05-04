export default function VerificationBanner({ isVerified }) {
  if (isVerified) return null;

  return (
    <div
      style={{
        backgroundColor: "#facc15",
        color: "#000",
        padding: "10px",
        textAlign: "center",
        fontWeight: "500",
      }}
    >
      Tài khoản của bạn chưa được xác thực. Vui lòng kiểm tra email để kích hoạt.
    </div>
  );
}