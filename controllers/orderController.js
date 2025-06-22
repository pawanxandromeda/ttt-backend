// orderController.ts
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
 console.log(razorpay,"rz")
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, package_id } = req.body;

    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // convert to paise
      currency: "INR",
     receipt: `pkg-${Date.now()}`
,
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
    });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(400).json({ error: "Invalid signature. Payment failed." });
    }
  } catch (err) {
    console.error("Payment verification failed:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};