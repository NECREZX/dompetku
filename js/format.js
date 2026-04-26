const Format = {
    rupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    date(dateStr) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    },

    toHTMLDate(date) {
        return date.toISOString().split('T')[0];
    },

    dateMonth(dateStr) {
        const options = { year: 'numeric', month: 'long' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    }
};
