import moment from 'moment';

moment.locale('pt-br');

export const Formatters = {
  currency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  },

  date(date) {
    if (!date) return '-';
    return moment(date).format('DD/MM/YYYY');
  },

  datetime(date) {
    if (!date) return '-';
    return moment(date).format('DD/MM/YYYY HH:mm');
  },

  time(date) {
    if (!date) return '-';
    return moment(date).format('HH:mm');
  },

  distance(km) {
    if (!km) return '0 km';
    return `${parseFloat(km).toFixed(1)} km`;
  },

  percentage(value) {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  },
};


