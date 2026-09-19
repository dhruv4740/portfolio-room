export async function predictFraud(features: unknown) {
  await new Promise(resolve => setTimeout(resolve, 180));
  const amount = Array.isArray(features) ? Number(features[0]) : 0;
  return {
    prediction: amount > 10000 ? 1 : 0,
    probability: amount > 10000 ? 0.91 : 0.12,
    demo: true,
  };
}
