## Summary of Assets

**intent-kb-results-0.json**

This is a real payload that then caused all the `** **` for bolding to clump at the beginning of the document.

```
****************************customers and operations of banks, savings associations and credit unions (collectively, “financial institutions”).
```

**intent-kb-results-1.json**

Real payload where we were mixing up the source URLs between the FAQ and the Suggested answers.  The FAQ answer is returned but the Suggested URL is used.

**intent-kb-results-2.json**

The highlights were not working on this payload, noticed the `author**ity`

```
    "displayText": "**Bitcoin has been described as a decentralized, peer-to-peer virtual currency that is used like money – it can be exchanged for traditional currencies such as the U.S. dollar, or used to purchase goods or services, usually online. Unlike traditional currencies, Bitcoin operates without central author**ity or banks and is not backed by any government.\n\nIRS treats Bitcoin as property. The IRS recently issued guidance stating that it will treat virtual currencies, such as Bitcoin, as property for federal tax purposes. As a result, general tax principles that apply to property transactions apply to transactions using virtual currency.\nAny other questions?",
```