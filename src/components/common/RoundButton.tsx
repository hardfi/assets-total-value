import {Button} from "./Button";
import styled from "styled-components";

export const RoundButton = styled(Button)`
  position: fixed;
  bottom: 30px;
  right: 20px;
  width: 80px;
  height: 80px;
  border-radius: 100%;
  font-size: 32px;
  box-shadow: 0 0 10px 0 black;
`;