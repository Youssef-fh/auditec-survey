// flow.js

import axios from "axios";

const WEBHOOK_URL = "https://hook.eu2.make.com/qrwj6nxlzifdlr5f16sqikjx5y621nah";

const SCREEN_RESPONSES = {
  RECOMMEND: { screen: "RECOMMEND", data: {} },
  screen_ntdwcj: { screen: "screen_ntdwcj", data: {} },
  screen_rugcbv: { screen: "screen_rugcbv", data: {} },
  SUCCESS: {
    screen: "SUCCESS",
    data: {
      extension_message_response: {
        params: {
          flow_token: "REPLACE_WITH_FLOW_TOKEN"
        }
      }
    }
  }
};

export const getNextScreen = async (decryptedBody) => {
  const { action, screen, data, flow_token } = decryptedBody;

  // 1) Health check
  if (action === "ping") {
    return { data: { status: "active" } };
  }

  // 2) INIT: show language chooser
  if (action === "INIT") {
    return SCREEN_RESPONSES.RECOMMEND;
  }

  // 3) data_exchange: user submitted a form
  if (action === "data_exchange") {
    // Helper: send everything under `data` plus lang & flow_token
    const sendToWebhook = async (langCode) => {
      const payload = {
        lang: langCode,
        flow_token,
        ...data
      };
      try {
        await axios.post(WEBHOOK_URL, payload);
      } catch (err) {
        console.error("Webhook error:", err.message);
      }
    };

    switch (screen) {
      case "RECOMMEND": {
        // route by language choice
        const next = data.screen_0_Choose_one_0 === "0_Français"
          ? "screen_ntdwcj"
          : "screen_rugcbv";
        return {
          ...SCREEN_RESPONSES[next],
          data: { screen_0_Choose_one_0: data.screen_0_Choose_one_0 }
        };
      }

      case "screen_ntdwcj": {
        // user completed French survey—send entire data object
        await sendToWebhook("fr");
        return {
          ...SCREEN_RESPONSES.SUCCESS,
          data: { extension_message_response: { params: { flow_token } } }
        };
      }

      case "screen_rugcbv": {
        // user completed Arabic survey—send entire data object
        await sendToWebhook("ar");
        return {
          ...SCREEN_RESPONSES.SUCCESS,
          data: { extension_message_response: { params: { flow_token } } }
        };
      }

      default:
        throw new Error(`Unhandled screen: ${screen}`);
    }
  }

  throw new Error(`Unhandled action=${action} on screen=${screen}`);
};
