/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState, useEffect } from "react";
const Header = ({ handleOpen, headerStyle }) => {
    const [scroll, setScroll] = useState(0)
    useEffect(() => {
        document.addEventListener("scroll", () => {
            const scrollCheck = window.scrollY > 100
            if (scrollCheck !== scroll) {
                setScroll(scrollCheck)
            }
        })
    })
    return (
        <>
            <header className={scroll ? `${headerStyle} header sticky-bar stick ` : `${headerStyle} header sticky-bar`}>
                <div className="container-fluid">
                    <div className="main-header">
                        <div className="header-left">
                            <div className="header-logo">
                                <Link href="/" legacyBehavior>
                                    <a className="d-flex logo-container">
                                        {headerStyle ? <ImageBitmap alt="myclover" src="/assets/imgs/template/logo.png" /> : <img alt="Agon" src="/assets/imgs/template/logo.png" />}
                                    </a>
                                </Link>
                            </div>
                            <div className="header-nav">
                                <nav className="nav-main-menu d-none d-xl-block">
                                    <ul className="main-menu">
                                    <li className="">
                                            <Link href="#" legacyBehavior><a className="active">Home</a></Link>
                                            {/* <ul className="sub-menu two-col">
                                                <li>
                                                    <Link href="/" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 1</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/index-2" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 2</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/index-3" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 3</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/index-4" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 4</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/index-5" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 5</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/index-6" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 6</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/index-7" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 7</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/index-8" legacyBehavior><a><i className="fi fi-rr-home" />Homepage - 8</a></Link>
                                                </li>
                                            </ul> */}
                                        </li>
                                        {/* <li className="has-children"> */}
                                        <li className="">
                                            <Link href="#" legacyBehavior><a>About</a></Link>
                                            {/* <ul className="sub-menu">
                                                <li>
                                                    <Link href="/page-about-1" legacyBehavior><a><i className="fi fi-rr-star" />About Us - 1</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-about-2" legacyBehavior><a><i className="fi fi-rr-star" />About Us - 2</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-about-3" legacyBehavior><a><i className="fi fi-rr-star" />About Us - 3</a></Link>
                                                </li>
                                            </ul> */}
                                        </li>
                                        {/* <li className="has-children"> */}
                                        <li className="">
                                            <Link href="#" legacyBehavior><a>Company</a></Link>
                                            {/* <ul className="sub-menu">
                                                <li>
                                                    <Link href="/page-service-1" legacyBehavior><a className="closer"><i className="fi fi-rr-gem" />Services - 1</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-service-2" legacyBehavior><a className="closer"><i className="fi fi-rr-gem" />Services - 2</a></Link>
                                                </li>
                                                <li className="hr"><span /></li>
                                                <li>
                                                    <Link href="/page-pricing-1" legacyBehavior><a className="closer"><i className="fi fi-rr-database" />Pricing - 1</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-pricing-2" legacyBehavior><a className="closer"><i className="fi fi-rr-database" />Pricing - 2</a></Link>
                                                </li>
                                                <li className="hr"><span /></li>
                                                <li>
                                                    <Link href="/page-faqs-1" legacyBehavior><a className="closer"><i className="fi fi-rr-headset" />FAQs - 1</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-faqs-2" legacyBehavior><a className="closer"><i className="fi fi-rr-headset" />FAQs - 2</a></Link>
                                                </li>
                                                <li className="hr"><span /></li>
                                                <li>
                                                    <Link href="/page-career" legacyBehavior><a className="closer"><i className="fi fi-rr-briefcase" />Career</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-career-detail" legacyBehavior><a className="closer"><i className="fi fi-rr-briefcase" />Career Detail</a></Link>
                                                </li>
                                            </ul> */}
                                        </li>
                                        {/* <li className="has-children"> */}
                                        <li className="">
                                            <Link href="#" legacyBehavior><a>Service</a></Link>
                                            {/* <ul className="sub-menu">
                                                <li>
                                                    <Link href="/page-contact" legacyBehavior><a><i className="fi fi-rr-paper-plane" />Contact</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-signup" legacyBehavior><a><i className="fi fi-rr-user-add" />Sign Up</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-login" legacyBehavior><a><i className="fi fi-rr-fingerprint" />Log In</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/page-reset" legacyBehavior><a><i className="fi fi-rr-settings" />Reset Password</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/404" legacyBehavior><a><i className="fi fi-rr-exclamation" />Error 404</a></Link>
                                                </li>
                                            </ul> */}
                                        </li>
                                        {/* <li className="has-children"> */}
                                        <li className="">
                                            <Link href="#" legacyBehavior><a>Blog</a></Link>
                                            {/* <ul className="sub-menu">
                                                <li>
                                                    <Link href="/blog-1" legacyBehavior><a className="closer"><i className="fi fi-rr-edit" />Blog Archive - 1</a></Link>
                                                </li>
                                                <li>
                                                    <Link href="/blog-2" legacyBehavior><a className="closer"><i className="fi fi-rr-edit" />Blog Archive - 2</a></Link>
                                                </li>
                                                <li className="hr"><span /></li>
                                                <li>
                                                    <Link href="/blog-single" legacyBehavior><a><i className="fi fi-rr-document-signed" />Blog Single</a></Link>
                                                </li>
                                            </ul> */}
                                        </li>
                                        {/* <li className="has-children"> */}
                                        <li className="">
                                            <a href="#">Contact</a>
                                            {/* <ul className="sub-menu">
                                                <li><Link href="/page-shop-grid-1" legacyBehavior><a className="closer"><i className="fi fi-rr-edit"></i>Shop Grid - 1</a></Link></li>
                                                <li><Link href="/page-shop-grid-2" legacyBehavior><a className="closer"><i className="fi fi-rr-edit"></i>Shop Grid - 2</a></Link></li>
                                                <li><Link href="/shop/1" legacyBehavior><a className="closer"><i className="fi fi-rr-edit"></i>Product Details</a></Link></li>
                                            </ul> */}
                                        </li>
                                    </ul>
                                </nav>
                                {/* <div className="burger-icon burger-icon-white" onClick={handleOpen}>
                                    <span className="burger-icon-top" /><span className="burger-icon-mid" /><span className="burger-icon-bottom" />
                                </div> */}
                            </div>
                        </div>
                        <div className="header-right">
                            <div className="block-signin">
                                <Link href="/page-signup" legacyBehavior><a className="btn btn-default hover-up icon-arrow-right-white btn-top">Request Service</a></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

        </>
    );
};

export default Header;