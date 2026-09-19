const base = import.meta.env.BASE_URL;

export default function Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-primary font-body">
      <div className="absolute left-[6vw] top-[10vh] w-[8vw] h-[1vh] bg-accent" />
      <div className="absolute left-[6vw] top-[28vh] w-[43vw]">
        <h1 className="font-display text-[7.8vw] font-extrabold tracking-[-0.055em] leading-[1]">Kaya Foods</h1>
        <p className="mt-[5vh] text-[3vw] leading-[1.18] w-[38vw] text-balance">Good food. Thoughtfully selected.</p>
        <p className="mt-[8vh] text-[1.5vw] text-muted">Website prototype · Client review</p>
      </div>
      <img src={`${base}images/kaya-strawberry-jam.webp`} crossOrigin="anonymous" alt="Food still-life imagery from the prototype" className="absolute right-[5vw] top-[10vh] w-[42vw] h-[76vh] object-cover rounded-[1.3vw]" />
      <p className="absolute right-[5vw] bottom-[5vh] text-[1.5vw] text-muted">01 / 06</p>
    </div>
  );
}