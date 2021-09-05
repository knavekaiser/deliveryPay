(this["webpackJsonpdeliveryPay-react"]=this["webpackJsonpdeliveryPay-react"]||[]).push([[7],{73:function(e,t,c){"use strict";c.r(t),c.d(t,"StartTransaction",(function(){return h}));var n=c(3),s=c(1),l=c(4),i=c(2),a=c(12),r=c(45),j=c(9),o=c(17),u=c(0),d=Object(s.lazy)((function(){return Promise.all([c.e(0),c.e(6)]).then(c.bind(null,158)).then((function(e){return{default:e.MilestoneForm}}))})),h=function(){var e=Object(s.useContext)(a.d).userType,t=Object(l.g)(),c=Object(s.useState)(""),h=Object(n.a)(c,2),b=(h[0],h[1],Object(s.useState)([])),O=Object(n.a)(b,2),m=(O[0],O[1],Object(s.useState)([])),x=Object(n.a)(m,2),p=x[0],f=x[1],N=Object(s.useState)(null),v=Object(n.a)(N,2),y=v[0],C=v[1],g=Object(s.useState)(null),M=Object(n.a)(g,2),k=M[0],S=M[1];Object(s.useRef)();return Object(s.useEffect)((function(){fetch("/api/recentPayments").then((function(e){return e.json()})).then((function(e){f(e)})).catch((function(e){console.log(e)}))}),[]),Object(s.useEffect)((function(){"/account/home/pay"!==t.location.pathname||y||t.push("/account/home")}),[]),Object(u.jsxs)("div",{className:"homeContainer",children:[Object(u.jsxs)("div",{className:"benner",children:[Object(u.jsx)("h4",{children:"Start transactions with Delivery pay"}),Object(u.jsx)("p",{children:"Connect with new buyers/sellers."})]}),Object(u.jsx)(r.UserSearch,{setClient:C}),Object(u.jsxs)("div",{className:"recentPayments",children:[Object(u.jsxs)("p",{className:"label",children:["Recent Payments",Object(u.jsx)("span",{className:"note",children:"buyer"===e?"Click to view all their products.":"Click to request a milestone."})]}),Object(u.jsxs)("ul",{className:"payments",children:[p.map((function(t){return Object(u.jsx)("li",{children:Object(u.jsxs)(i.b,{target:"buyer"===e?"_blank":"",to:"buyer"===e?"/marketplace?seller=".concat(t._id):"/account/home/requestMilestone",onClick:function(){C(t)},children:[Object(u.jsx)(j.n,{src:t.profileImg}),Object(u.jsx)("p",{className:"name",children:t.firstName+" "+t.lastName})]})},t._id)})),0===p.length&&Object(u.jsx)("p",{children:"Nothing for now"})]})]}),Object(u.jsx)(l.b,{path:"/account/home/createMilestone",children:Object(u.jsx)(o.Modal,{open:!0,head:!0,label:"Create Milestone",setOpen:function(){t.push("/account/home"),C(null)},className:"milestoneRequest",children:Object(u.jsx)(d,{action:"create",client:y,onSuccess:function(e){t.push("/account/home"),S(Object(u.jsxs)(u.Fragment,{children:[Object(u.jsx)("button",{onClick:function(){return S(null)},children:"Okay"}),Object(u.jsxs)("div",{children:[Object(u.jsx)(j.C,{}),Object(u.jsxs)("h4",{className:"amount",children:["\u20b9",null===e||void 0===e?void 0:e.amount]}),Object(u.jsx)("h4",{children:"Milestone has been created"})]}),Object(u.jsx)(i.b,{to:"/account/hold",onClick:function(){return S(null)},children:"Check your Delivery pay Hold"})]}))}})})}),Object(u.jsx)(l.b,{path:"/account/home/requestMilestone",children:Object(u.jsx)(o.Modal,{open:!0,head:!0,label:"Request Milestone",setOpen:function(){t.push("/account/home"),C(null)},className:"milestoneRequest",children:Object(u.jsx)(d,{action:"request",client:y,onSuccess:function(e){t.push("/account/home"),S(Object(u.jsxs)(u.Fragment,{children:[Object(u.jsx)("button",{onClick:function(){return S(null)},children:"Okay"}),Object(u.jsxs)("div",{children:[Object(u.jsx)(j.C,{}),Object(u.jsxs)("h4",{className:"amount",children:["\u20b9",null===e||void 0===e?void 0:e.amount]}),Object(u.jsx)("h4",{children:"Milestone has been requested"})]}),Object(u.jsx)(i.b,{to:"/account/hold",onClick:function(){return S(null)},children:"Check your Delivery pay Hold"})]}))}})})}),Object(u.jsx)(o.Modal,{className:"msg",open:k,children:k})]})},b=function(e){var t,c,n,l,i=e.transaction,r=Object(s.useContext)(a.d).user;return Object(u.jsxs)("li",{className:"transaction ".concat(i.amount>0?"in":"out"),children:[Object(u.jsx)("div",{className:"transactionDetail",children:Object(u.jsx)("div",{className:"profile",children:i.client?Object(u.jsxs)(u.Fragment,{children:[Object(u.jsx)(j.n,{src:(null===(t=i.client._id)||void 0===t?void 0:t.profileImg)||"/profile-user.jpg"}),Object(u.jsx)("p",{className:"name",children:i.client.firstName+" "+i.client.lastName})]}):Object(u.jsxs)(u.Fragment,{children:[Object(u.jsx)(j.n,{src:r.profileImg||"/profile-user.jpg"}),Object(u.jsx)("p",{className:"name",children:r.firstName+" "+r.lastName})]})})}),Object(u.jsxs)("ul",{children:[Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Role"}),"-",Object(u.jsx)("p",{className:"role",children:i.amount>0?"Seller":"Buyer"})]}),Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Product detail"}),"-",Object(u.jsx)("p",{children:i.dscr||"-"})]}),Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Transaction ID"}),"-",Object(u.jsx)("p",{children:i._id})]})]}),Object(u.jsxs)("ul",{className:"amountDate",children:[Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Amount"}),"-",Object(u.jsxs)("p",{className:"amount",children:["\u20b9",i.amount.fix()]})]}),Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Hold Date"}),"-",Object(u.jsx)("p",{children:Object(u.jsx)(j.s,{format:"MMM DD, YYYY, hh:mm a",children:i.createdAt})})]}),Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Released Date"}),"-",Object(u.jsx)("p",{children:Object(u.jsx)(j.s,{format:"MMM DD, YYYY, hh:mm a",children:(null===(c=i.milestoneId)||void 0===c?void 0:c.releaseDate)||"--"})})]})]}),Object(u.jsxs)("ul",{className:"statusMethod",children:[Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Status"}),"-",Object(u.jsx)("p",{className:"status",children:(null===(n=i.milestoneId)||void 0===n?void 0:n.status)||"--"})]}),Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Released to"}),"-",Object(u.jsx)("p",{children:i.amount<0?"Seller":"--"})]}),Object(u.jsxs)("li",{children:[Object(u.jsx)("p",{children:"Verification Method"}),"-",Object(u.jsx)("p",{children:(null===(l=i.milestoneId)||void 0===l?void 0:l.verification)||"--"})]})]})]})};t.default=function(e){e.history,e.location,e.match;var t=Object(s.useState)([]),c=Object(n.a)(t,2),l=c[0],i=c[1],a=Object(s.useState)(null),r=Object(n.a)(a,2),d=r[0],h=r[1];return Object(s.useEffect)((function(){fetch("/api/transactions?type=P2PTransaction").then((function(e){if(200===e.status)return e.json()})).then((function(e){e&&i(e)})).catch((function(e){console.log(e),h(Object(u.jsxs)(u.Fragment,{children:[Object(u.jsx)("button",{onClick:function(){return h(null)},children:"Okay"}),Object(u.jsxs)("div",{children:[Object(u.jsx)(j.i,{}),Object(u.jsx)("h4",{children:"Could not get transactions."})]})]}))}))}),[]),Object(u.jsxs)("div",{className:"transactionContainer",children:[Object(u.jsx)("p",{className:"benner",children:"Completed Delivery pay Hold Transactions"}),Object(u.jsxs)("ul",{className:"transactions",children:[l.map((function(e){return Object(u.jsx)(b,{transaction:e},e._id)})),0===l.length&&Object(u.jsx)("p",{className:"placeholder",children:"No transaction yet."})]}),Object(u.jsx)(o.Modal,{className:"msg",open:d,children:d})]})}}}]);
//# sourceMappingURL=7.3456b33e.chunk.js.map