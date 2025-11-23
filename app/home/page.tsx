import { Item } from "../components/item";
import ProfileImg from "../../public/assets/images/profile.png";

const HomePage = () => {
  return (
    <div>
      <Item image={ProfileImg} title="Item 1"/>
    </div>
  );
};

export default HomePage;