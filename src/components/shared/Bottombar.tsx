

import { bottombarLinks } from "@/constants";
import { INavLink } from "@/types";
import { imageNameWithUrl } from "@/types/utils";
import { Link, useLocation } from "react-router-dom";

const BottomBar = () => {
  const { pathname } = useLocation();
  return (
    <div className="bottom-bar">
      {bottombarLinks.map((link: INavLink) => {
        const isActive = pathname === link.route;
        return (
          <Link
            key={link.label}
            className={`${
              isActive && "bg-primary-500 rounded-[10px]"
            }  flex-center flex-col gap-1 p-2 transition`}
            to={link.route}
          >
            <img
              src={imageNameWithUrl(link.imgName)}
              alt={link.label}
              className={`${isActive && "invert-white"}`}
              width={20}
              height={20}
            />
            <p className="tiny-large text-light-2">{link.label}</p>
          </Link>
        );
      })}
    </div>
  );
};

export default BottomBar;