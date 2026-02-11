function EmptyState() {
  return (
    <div
      style={{
        width: "100%",
        textAlign: "center",
        padding: "100px 20px",
        color: "#555",
        animation: "fade 0.8s ease-in-out",
      }}
    >
      <style>
        {`
          @keyframes fade {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes bounce {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>

      <div style={{ fontSize: "64px", animation: "bounce 1.5s infinite" }}>
        📭
      </div>

      <h2>No Candidates Yet</h2>
      <p>Once applications are submitted, they will automatically appear here.</p>
    </div>
  );
}

export default EmptyState;
