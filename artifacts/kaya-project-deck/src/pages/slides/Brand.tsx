const base = import.meta.env.BASE_URL;

export default function Brand() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-primary font-body px-[6vw] pt-[7vh]">
      <h1 className="w-[82vw] text-[4vw] font-extrabold tracking-tight leading-[1.08] text-balance">A local food brand, thoughtfully presented</h1>
      <div className="mt-[5vh] w-[8vw] h-[0.7vh] bg-accent" />
      <ul className="absolute left-[6vw] top-[32vh] w-[48vw] space-y-[3.5vh] pl-[1.5vw] list-disc marker:text-[#1A7A44] text-[2vw] leading-[1.3]">
        <li>A starting business selecting quality foods made locally in Rwanda</li>
        <li>Initial categories: jam, juices, chilli and tomato paste</li>
        <li>A fresh, approachable identity in forest green, lime and off-white</li>
        <li>A focused catalogue, with room for the selection to grow</li>
      </ul>
      <img src={`${base}images/kaya-rwandan-pantry.webp`} crossOrigin="anonymous" alt="Produce-basket illustration from the website" className="absolute right-[6vw] top-[29vh] w-[34vw] h-[53vh] object-cover rounded-[1vw]" />
      <div aria-hidden="true" className="absolute right-[6vw] top-[84vh] flex w-[34vw] h-[2vh]">
        <div className="w-1/3 bg-primary" /><div className="w-1/3 bg-accent" /><div className="w-1/3 bg-[#7A9080]" />
      </div>
      <p className="absolute left-[6vw] bottom-[4vh] text-[1.5vw] font-semibold">kaya foods</p>
      <p className="absolute right-[6vw] bottom-[4vh] text-[1.5vw] text-muted">02 / 06</p>
    </div>
  );
}