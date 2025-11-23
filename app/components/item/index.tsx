import Image, { StaticImageData } from "next/image";

type ItemProps = {
  image: StaticImageData | string;
  title: string;
  className?: string;
};

export const Item = ({ image, title, className }: ItemProps) => {
  return (
    <div
      className={`flex flex-col items-center rounded-xl bg-white p-6 text-center shadow-md shadow-blue-100 transition hover:-translate-y-1 hover:shadow-lg ${className ?? ""}`}
    >
      <div className="relative h-40 w-56 sm:h-48 sm:w-64">
        <Image
          src={image}
          alt={title}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 224px, 256px"
        />
      </div>
      <p className="mt-4 text-lg font-semibold uppercase tracking-wide text-[#2A46A1]">
        {title}
      </p>
    </div>
  );
};

export default Item;