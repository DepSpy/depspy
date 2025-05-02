export interface DropDownProps {
  title?: string;
  options: {
    label: string;
    value: Set<string>;
  }[];
  onSelect?: (value: Set<string>) => void;
}
