const base = import.meta.env.BASE_URL;

export default function Website() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-primary font-body px-[6vw] pt-[7vh]">
      <h1 className="w-[85vw] text-[4vw] font-extrabold tracking-tight leading-[1.08]">A simple website for everyday ordering</h1>
      <div className="mt-[5vh] w-[8vw] h-[0.7vh] bg-accent" />
      <ul className="absolute left-[6vw] top-[31vh] w-[38vw] space-y-[3vh] pl-[1.5vw] list-disc marker:text-[#1A7A44] text-[2vw] leading-[1.3]">
        <li>Mobile-first layout with product, story and ordering sections</li>
        <li>Product sizes, quantities and prices in RWF</li>
        <li>Basket editing, line totals and subtotal</li>
        <li>Basket saved in the customer’s browser</li>
        <li>Coming-soon and unavailable items cannot be added</li>
      </ul>
      <img src={`${base}images/catalogue.jpg`} crossOrigin="anonymous" alt="Screenshot of the website catalogue" className="absolute right-[5vw] top-[28vh] w-[46vw] h-[59vh] object-contain rounded-[0.8vw] border border-primary/15" />
      <p className="absolute left-[6vw] bottom-[4vh] text-[1.5vw] font-semibold">kaya foods</p>
      <p className="absolute right-[6vw] bottom-[4vh] text-[1.5vw] text-muted">03 / 06</p>
    </div>
  );
}