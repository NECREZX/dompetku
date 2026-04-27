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

    dateTime(dateStr) {
        const options = { 
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    },

    toHTMLDate(date) {
        const offset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    },


    dateMonth(dateStr) {
        const options = { year: 'numeric', month: 'long' };
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    }
};
