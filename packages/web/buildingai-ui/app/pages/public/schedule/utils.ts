export const getLocalDate = (offset_month = 0, offset_day = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset_month);
    date.setDate(date.getDate() + offset_day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const formatDateLocal = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

export const parseLocalDate = (s: string) => {
    const [y, m, d] = s.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
};

export const formatDisplayDateFromString = (s: string) => {
    try {
        const d = parseLocalDate(s);
        return `${d.getMonth() + 1}月${d.getDate()}日`;
    } catch {
        return s;
    }
};
