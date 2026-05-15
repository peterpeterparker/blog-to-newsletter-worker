import { TelegramBotAnswer, TelegramBotEditMessage } from "./telegram/types";
import { Factory } from "../common/types";

interface Bot {
  answer(params: TelegramBotAnswer): Promise<void>;
  editMessage(params: TelegramBotEditMessage): Promise<void>;
}

export function BotProvider(_constructor: Factory<Bot>) {}
