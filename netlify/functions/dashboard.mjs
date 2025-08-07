export const handler = async (event, context) => {
  console.log("--- SIMPLE DASHBOARD LOG ---");
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      success: true,
      data: { message: "A função dashboard está funcionando!" },
      error: null
    })
  };
};