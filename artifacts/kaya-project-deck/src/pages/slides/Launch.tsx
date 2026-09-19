export default function Launch() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-primary font-body px-[6vw] pt-[7vh]">
      <h1 className="w-[88vw] text-[4vw] font-extrabold tracking-tight leading-[1.08]">What we need to launch</h1>
      <div className="mt-[5vh] w-[8vw] h-[0.7vh] bg-accent" />
      <ol className="absolute left-[6vw] right-[6vw] top-[30vh] grid grid-cols-2 gap-x-[6vw] gap-y-[5vh] text-[2vw] leading-[1.3]">
        <li className="flex gap-[1.5vw] border-t border-primary/20 pt-[2.5vh]">
          <span className="text-[#1A7A44] font-semibold">01</span>
          <p>Confirm product descriptions, sizes, prices and availability</p>
        </li>
        <li className="flex gap-[1.5vw] border-t border-primary/20 pt-[2.5vh]">
          <span className="text-[#1A7A44] font-semibold">02</span>
          <p>Supply actual product photos and clean logo files</p>
        </li>
        <li className="flex gap-[1.5vw] border-t border-primary/20 pt-[2.5vh]">
          <span className="text-[#1A7A44] font-semibold">03</span>
          <p>Add the WhatsApp Business number and contact details</p>
        </li>
        <li className="flex gap-[1.5vw] border-t border-primary/20 pt-[2.5vh]">
          <span className="text-[#1A7A44] font-semibold">04</span>
          <p>Confirm delivery areas, fees, payment methods and opening hours</p>
        </li>
        <li className="flex gap-[1.5vw] border-t border-primary/20 pt-[2.5vh]">
          <span className="text-[#1A7A44] font-semibold">05</span>
          <p>Approve story copy and any organic or certification claims</p>
        </li>
        <li className="flex gap-[1.5vw] border-t border-primary/20 pt-[2.5vh]">
          <span className="text-[#1A7A44] font-semibold">06</span>
          <p>Choose the domain, complete final checks and publish</p>
        </li>
      </ol>
      <p className="absolute left-[6vw] bottom-[4vh] text-[1.5vw] font-semibold">kaya foods</p>
      <p className="absolute right-[6vw] bottom-[4vh] text-[1.5vw] text-muted">06 / 06</p>
    </div>
  );
}