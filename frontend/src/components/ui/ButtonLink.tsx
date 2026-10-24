import { Link, type LinkProps } from 'react-router-dom';
import { buttonStyles, type ButtonSize, type ButtonVariant } from './Button';

interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonStyles(variant, size, className)} {...rest} />;
}
