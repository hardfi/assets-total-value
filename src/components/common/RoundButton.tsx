import {Button} from "./Button";
import styled from "styled-components";

export const RoundButton = styled(Button)`
  position: fixed;
  bottom: 40px;
  right: 30px;
  width: 70px;
  height: 70px;
  border-radius: 100%;
  font-size: 32px;
  box-shadow: 0 0 10px 0 black;
`;