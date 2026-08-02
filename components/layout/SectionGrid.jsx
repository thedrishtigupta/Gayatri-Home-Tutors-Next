
export const SectionGrid = ({ title, subtitle, titleColor, gridClass, items, renderItem }) => {
    return (
        <div className="our-values">
        <div className="upper-values">
            <h2 className={titleColor}>{title}</h2>
            <p>{subtitle}</p>
        </div>

        <div className={gridClass}>
            {items.map((item, index) => renderItem(item, index))}
        </div>
        </div>
    );
};