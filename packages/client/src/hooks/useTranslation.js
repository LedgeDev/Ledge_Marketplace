import { useIntl } from 'react-intl';

const useTranslation = () => {
  const intl = useIntl();
  const t = (id) => intl.formatMessage({ id });
  const locale = intl.locale;
  return { t, locale };
};

export { useTranslation };
