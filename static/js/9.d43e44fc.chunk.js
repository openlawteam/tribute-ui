(this["webpackJsonptribute-ui"]=this["webpackJsonptribute-ui"]||[]).push([[9],{987:function(e,t,n){"use strict";n.r(t),n.d(t,"default",(function(){return w}));var c=n(3),a=n(4),l=n(64),s=n(141),r=n(61),o=n(42),i=n(1);var d=n(15),j=n(11),b=n(62),u=n(12),O=n(14),m=n(443),h=n(79),v=n(158),f=n(109),x=n(0),p=["isOpen","onRequestClose"];function w(e){var t=e.modalProps,n=t.isOpen,w=t.onRequestClose,_=Object(l.a)(t,p),k=e.maybeContractWallet,C=void 0!==k&&k,N=Object(d.c)((function(e){var t=e.connectedMember;return!0===(null===t||void 0===t?void 0:t.isActiveMember)})),g=Object(d.c)((function(e){var t=e.connectedMember;return null===t||void 0===t?void 0:t.memberAddress})),M=Object(O.f)(),y=M.account,W=M.connected,A=M.connectWeb3Modal,E=M.disconnectWeb3Modal,P=M.networkId,R=M.providerOptions,q=M.web3Modal,D=Object(O.d)(),F=D.defaultChainError,H=D.isDefaultChain,J=Object(r.g)().pathname,S=function(e){var t=Object(i.useRef)();return Object(i.useEffect)((function(){t.current=e})),t.current}(J),G=!1===H,I=P===j.c.GANACHE,T="/members/".concat(g),z=Object.entries(R).filter((function(e){var t=Object(a.a)(e,1)[0];return!Object(s.isMobile)()||"injected"!==t})).map((function(e){var t=I&&"walletconnect"===e[0];return Object(x.jsxs)("button",{"aria-label":"Connect to ".concat(e[1].display.name),className:"walletconnect__options-button \n            ".concat(W&&(null===q||void 0===q?void 0:q.cachedProvider)===e[0]?"walletconnect__options-button--connected":""),onClick:function(){return t?function(){}:A(e[0])},disabled:t,children:[Object(x.jsx)("span",{className:"wallet-name",children:e[1].display.name}),Object(x.jsx)(m.a,{providerName:e[0]})]},e[0])}));function B(){n&&S&&S===T&&w()}return Object(i.useEffect)((function(){n&&J===T&&S&&S!==T&&setTimeout(w,0)}),[n,T,w,J,S]),Object(x.jsxs)(v.a,Object(c.a)(Object(c.a)({keyProp:"connectWalletModal",isOpen:n,isOpenHandler:w},_),{},{children:[Object(x.jsx)("span",{className:"modal__close-button",onClick:function(){w()},children:Object(x.jsx)(f.a,{})}),Object(x.jsxs)("div",{children:[Object(x.jsx)("div",{className:"modal__title",children:"Connect Wallet"}),(!W||!G)&&Object(x.jsx)("div",{className:"modal__subtitle",children:"Choose your wallet"}),function(){if(!W||!C||G)return null;var e=N?Object(x.jsxs)(x.Fragment,{children:["As a member, you can"," ",Object(x.jsx)(o.b,{onClick:B,to:T,children:"set a delegate"})," ","to a key-based wallet, like MetaMask."]}):null;return Object(x.jsx)("p",{className:"error-message",children:Object(x.jsxs)("small",{children:["Smart contract wallets are not currently supported. ",e]})})}(),W&&G&&Object(x.jsxs)(x.Fragment,{children:[Object(x.jsx)("div",{className:"error-message",children:Object(x.jsx)("small",{children:(null===F||void 0===F?void 0:F.message)||""})}),Object(x.jsx)("div",{className:"loader--large-container",children:Object(x.jsx)(h.a,{})}),Object(x.jsxs)("div",{children:[Object(x.jsx)("small",{children:"Waiting for the right network"}),Object(x.jsx)(b.a,{}),Object(x.jsx)("br",{}),Object(x.jsx)("small",{children:"Switch networks from your wallet."})]})]}),y&&Object(x.jsx)("div",{children:Object(x.jsx)("span",{className:"walletconnect__connected-address-text",children:Object(u.l)(y,7)})}),(!W||!G)&&Object(x.jsx)("div",{className:"walletconnect__options",children:z}),W&&Object(x.jsx)("button",{className:"walletconnect__disconnect-link-button",onClick:E,children:"Disconnect Wallet"})]})]}))}}}]);
//# sourceMappingURL=9.d43e44fc.chunk.js.map