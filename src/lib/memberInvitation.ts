export const MEMBER_INVITATION_DEFAULT_TEMPLATE = `السلام عليكم ورحمة الله وبركاته

പ്രിയ കൂട്ടുകാരാ...

       ഖിയാമത് നാളിൽ സൂര്യൻ തലക്ക് മീതെ കത്തിജ്വലിക്കുമ്പോൾ *SSF കാർക്ക് അർശിൻ്റ തണലുണ്ട്.* വടകര മുഹമ്മദ് ഹാജി തങ്ങളുടെ വാക്കുകളാണിത്.

തെറ്റുകളിലേക്ക് വഴുതിവീഴാൻ സാധ്യത ഏറെയുള്ള ഈ യൗവ്വനകാലത്ത് ഒരു SSF കാരനാവുക... *എത്ര വലിയ ഭാഗ്യമാണ്!*

നമ്മുടെ യൂണിറ്റ് പുതിയൊരു ചുവടുവെപ്പിലേക്ക് കാലെടുത്തുവെക്കുകയാണ്. അതിന്റെ ആദ്യഘട്ടമായി പ്രവർത്തകരുടെ *വിവരശേഖരണം* ആരംഭിച്ചിരിക്കുന്നു.

അതുകൊണ്ട്, താഴെ നൽകിയിരിക്കുന്ന ലിങ്കിൽ പ്രവേശിച്ച് നിങ്ങളുടെ വിവരങ്ങൾ കൃത്യമായി പൂരിപ്പിച്ച് അപ്ഡേറ്റ് ചെയ്യണമെന്ന് സ്നേഹപൂർവ്വം അഭ്യർത്ഥിക്കുന്നു.

ലോഗിൻ ലിങ്ക്: {loginUrl}
ഫോൺ നമ്പർ: {phone}
PIN: {pin}

നിങ്ങളുടെ സഹകരണം പ്രതീക്ഷിക്കുന്നു.

*©SSF ALPARAMBA*`;

export const MEMBER_INVITATION_ALLOWED_PLACEHOLDERS = [
  "{name}",
  "{phone}",
  "{pin}",
  "{loginUrl}",
] as const;

export const MEMBER_INVITATION_TEMPLATE_MAX_LENGTH = 1000;

export interface MemberInvitationTemplateValues {
  name: string;
  phone: string;
  pin: string;
  loginUrl: string;
}

const LEFT_TO_RIGHT_MARK = "\u200E";
const INVITATION_DIRECTION_HEADING = "*SSF ALPARAMBA*";
const PIN_PLACEHOLDER_TOKEN = "__MEMBER_INVITATION_PIN__";
const PIN_HIGHLIGHT_RULE = "──────────────";

function highlightInvitationPin(message: string, pin: string): string {
  return message
    .split("\n")
    .flatMap((line) => {
      if (!line.includes(PIN_PLACEHOLDER_TOKEN)) return [line];

      return [
        PIN_HIGHLIGHT_RULE,
        `*LOGIN PIN: ${pin}*`,
        PIN_HIGHLIGHT_RULE,
      ];
    })
    .join("\n");
}

function keepInvitationLinesLeftAligned(message: string): string {
  const leftAlignedBody = message
    .split("\n")
    .map((line) => line.trimStart())
    .map((line) => (line.length > 0 ? `${LEFT_TO_RIGHT_MARK}${line}` : line))
    .join("\n");

  return `${INVITATION_DIRECTION_HEADING}\n\n${leftAlignedBody}`;
}

export function renderMemberInvitationTemplate(
  template: string,
  values: MemberInvitationTemplateValues
): string {
  const renderedTemplate = template
    .split("{name}").join(values.name)
    .split("{phone}").join(values.phone)
    .split("{pin}").join(PIN_PLACEHOLDER_TOKEN)
    .split("{loginUrl}").join(values.loginUrl);
  const renderedMessage = highlightInvitationPin(renderedTemplate, values.pin);

  return keepInvitationLinesLeftAligned(renderedMessage);
}
