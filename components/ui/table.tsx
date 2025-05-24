import * as React from "react";

export const Table = (props: React.TableHTMLAttributes<HTMLTableElement>) => <table {...props} />;
export const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <tbody {...props} />;
export const TableCell = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td {...props} />;
export const TableHead = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th {...props} />;
export const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => <thead {...props} />;
export const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => <tr {...props} />;
