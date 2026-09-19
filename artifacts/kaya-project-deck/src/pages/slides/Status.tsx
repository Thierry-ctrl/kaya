export default function Status() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-primary font-body px-[6vw] pt-[7vh]">
      <h1 className="w-[88vw] text-[4vw] font-extrabold tracking-tight leading-[1.08]">Ready for review—not yet launched</h1>
      <div className="mt-[5vh] w-[8vw] h-[0.7vh] bg-accent" />
      <ul className="absolute left-[6vw] right-[6vw] top-[31vh] grid grid-cols-2 gap-x-[6vw] gap-y-[5vh] text-[2vw] leading-[1.3]">
        <li className="border-t border-primary/20 pt-[2.5vh]">Working prototype with brand styling and food imagery</li>
        <li className="border-t border-primary/20 pt-[2.5vh]">Products, sizes and prices are sample content</li>
        <li className="border-t border-primary/20 pt-[2.5vh]">Generated images are temporary presentation illustrations</li>
        <li className="border-t border-primary/20 pt-[2.5vh]">WhatsApp sending is disabled until the business number is supplied</li>
        <li className="border-t border-primary/20 pt-[2.5vh]">Static website: no customer login, payment gateway or backend required</li>
        <li className="border-t border-primary/20 pt-[2.5vh] font-semibold">The website has not been published</li>
      </ul>
      <p className="absolute left-[6vw] bottom-[4vh] text-[1.5vw] font-semibold">kaya foods</p>
      <p className="absolute right-[6vw] bottom-[4vh] text-[1.5vw] text-muted">05 / 06</p>
    </div>
  );
}