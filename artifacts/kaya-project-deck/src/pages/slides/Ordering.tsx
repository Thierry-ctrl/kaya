export default function Ordering() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-primary font-body px-[6vw] pt-[7vh]">
      <h1 className="w-[86vw] text-[4vw] font-extrabold tracking-tight leading-[1.08]">From basket to a WhatsApp request</h1>
      <div className="mt-[5vh] w-[8vw] h-[0.7vh] bg-accent" />
      <ol className="absolute top-[33vh] left-[6vw] right-[6vw] grid grid-cols-4 gap-[3vw]">
        <li className="border-t border-primary/25 pt-[2vh]">
          <span className="text-[3.5vw] font-extrabold text-[#1A7A44]">01</span>
          <p className="mt-[2vh] text-[2vw] leading-[1.3]">Choose products, sizes and quantities</p>
        </li>
        <li className="border-t border-primary/25 pt-[2vh]">
          <span className="text-[3.5vw] font-extrabold text-[#1A7A44]">02</span>
          <p className="mt-[2vh] text-[2vw] leading-[1.3]">Review the basket and subtotal</p>
        </li>
        <li className="border-t border-primary/25 pt-[2vh]">
          <span className="text-[3.5vw] font-extrabold text-[#1A7A44]">03</span>
          <p className="mt-[2vh] text-[2vw] leading-[1.3]">Open the prepared message and press Send in WhatsApp</p>
        </li>
        <li className="border-t border-primary/25 pt-[2vh]">
          <span className="text-[3.5vw] font-extrabold text-[#1A7A44]">04</span>
          <p className="mt-[2vh] text-[2vw] leading-[1.3]">Kaya manually confirms availability, delivery and payment</p>
        </li>
      </ol>
      <div className="absolute top-[76vh] left-[6vw] right-[6vw] border-t border-primary/20 pt-[3vh] grid grid-cols-2 gap-[5vw] text-[2vw] leading-[1.3]">
        <p>Delivery fees are separate from the subtotal</p>
        <p>Copy order summary is available as a fallback</p>
      </div>
      <p className="absolute left-[6vw] bottom-[4vh] text-[1.5vw] font-semibold">kaya foods</p>
      <p className="absolute right-[6vw] bottom-[4vh] text-[1.5vw] text-muted">04 / 06</p>
    </div>
  );
}