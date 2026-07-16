import React, { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, X, Bookmark, BookmarkCheck, Filter, RefreshCw } from 'lucide-react'

const C = {
  green:'#00B386',greenBg:'#E6F9F4',red:'#E84040',redBg:'#FEF0F0',
  navy:'#111A3A',navyDark:'#0C142B',blue:'#2563EB',blueBg:'#EEF3FF',
  gray50:'#F8F9FB',gray100:'#F1F3F6',gray200:'#E4E7EC',
  gray400:'#9AA3B2',gray600:'#5A6478',gray800:'#1E2636',white:'#FFFFFF',
}
const f2 = n => Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})

const SECTORS = [
  'Banking','IT','Oil & Gas','Pharma','Auto','Auto Parts',
  'Financial Services','Consumer Goods','Capital Goods','Electrical',
  'Chemicals','Textiles','Power','Healthcare','Apparel','Consumer Services',
]

const STOCKS = [
  // LARGECAP
  {sym:'RELIANCE',name:'Reliance Industries Ltd',sector:'Oil & Gas',sub:'Refining & Marketing',cat:'Largecap',mcap:1684000,price:2450.40,pe:26.5,pb:2.8,roe:10.8,roce:12.4,de:0.35,dy:0.42,rsi:58.4,g1:8.5,g3:14.5,g5:12.2,eg:12.4,pg:14.2,om:18.5,nm:8.9,cr:1.24,ph:50.39,fi:24.12,di:16.84,dii:18.5,vol:8423000,beta:0.88,h52:3024.9,l52:2220.3,pledge:0,peg:2.1,evEbitda:14.2,fcf:28500,wc:45200,altman:3.2,shortInt:0.8},
  {sym:'TCS',name:'Tata Consultancy Services',sector:'IT',sub:'IT Services',cat:'Largecap',mcap:1245000,price:3420.15,pe:28.1,pb:12.5,roe:44.5,roce:56.4,de:0.02,dy:1.45,rsi:54.2,g1:11.2,g3:12.8,g5:13.5,eg:10.8,pg:11.4,om:24.5,nm:19.2,cr:3.12,ph:72.03,fi:12.45,di:8.52,dii:14.2,vol:2145000,beta:0.62,h52:4255,l52:3056,pledge:0,peg:2.6,evEbitda:18.4,fcf:42000,wc:68000,altman:4.8,shortInt:0.4},
  {sym:'HDFCBANK',name:'HDFC Bank Ltd',sector:'Banking',sub:'Private Banks',cat:'Largecap',mcap:1120000,price:1610.80,pe:18.5,pb:2.45,roe:14.2,roce:7.8,de:5.8,dy:1.12,rsi:61.3,g1:14.8,g3:15.2,g5:16.4,eg:18.2,pg:20.5,om:42.5,nm:22.8,cr:0.12,ph:0,fi:52.85,di:28.45,dii:12.4,vol:12540000,beta:0.95,h52:1887.4,l52:1363.5,pledge:0,peg:1.0,evEbitda:9.2,fcf:55000,wc:0,altman:2.1,shortInt:0.6},
  {sym:'INFY',name:'Infosys Ltd',sector:'IT',sub:'IT Services',cat:'Largecap',mcap:610000,price:1480.20,pe:24.3,pb:8.2,roe:34.5,roce:42.8,de:0.04,dy:2.45,rsi:50.8,g1:6.8,g3:11.2,g5:13.4,eg:8.5,pg:9.2,om:21.4,nm:17.2,cr:2.85,ph:14.74,fi:34.82,di:25.64,dii:16.8,vol:3654000,beta:0.7,h52:1903.2,l52:1218.8,pledge:0,peg:2.9,evEbitda:15.8,fcf:22000,wc:38000,altman:4.2,shortInt:0.5},
  {sym:'ICICIBANK',name:'ICICI Bank Ltd',sector:'Banking',sub:'Private Banks',cat:'Largecap',mcap:780000,price:1110.40,pe:18.2,pb:2.85,roe:16.8,roce:8.2,de:6.2,dy:0.9,rsi:64.8,g1:22.4,g3:24.8,g5:20.5,eg:28.5,pg:30.2,om:45.8,nm:24.2,cr:0.14,ph:0,fi:46.24,di:30.42,dii:14.5,vol:14520000,beta:1.05,h52:1306.5,l52:900.2,pledge:0,peg:0.6,evEbitda:8.4,fcf:48000,wc:0,altman:2.4,shortInt:0.7},
  {sym:'SBIN',name:'State Bank of India',sector:'Banking',sub:'Public Banks',cat:'Largecap',mcap:620000,price:695.80,pe:11.4,pb:1.45,roe:13.2,roce:5.8,de:12.4,dy:1.85,rsi:55.2,g1:18.5,g3:15.8,g5:12.4,eg:22.4,pg:28.5,om:38.5,nm:18.2,cr:0.08,ph:57.54,fi:10.82,di:22.45,dii:8.2,vol:24510000,beta:1.18,h52:912.1,l52:600.8,pledge:0,peg:0.5,evEbitda:6.8,fcf:32000,wc:0,altman:1.8,shortInt:1.2},
  {sym:'LT',name:'Larsen & Toubro Ltd',sector:'Capital Goods',sub:'Engineering & Construction',cat:'Largecap',mcap:450000,price:3210.50,pe:36.8,pb:5.6,roe:15.4,roce:18.2,de:1.24,dy:1.05,rsi:58.5,g1:16.8,g3:14.5,g5:12.8,eg:20.5,pg:22.8,om:12.8,nm:8.5,cr:1.18,ph:0,fi:28.45,di:42.85,dii:22.4,vol:2854000,beta:1.12,h52:3962.2,l52:2525.1,pledge:0,peg:1.8,evEbitda:22.4,fcf:18000,wc:28000,altman:3.5,shortInt:0.9},
  {sym:'WIPRO',name:'Wipro Ltd',sector:'IT',sub:'IT Services',cat:'Largecap',mcap:285000,price:480.20,pe:22.4,pb:4.2,roe:18.2,roce:22.4,de:0.08,dy:0.22,rsi:46.8,g1:2.4,g3:8.5,g5:10.2,eg:5.8,pg:6.4,om:17.4,nm:14.2,cr:2.54,ph:72.91,fi:8.45,di:5.24,dii:8.4,vol:4524000,beta:0.85,h52:571.9,l52:380.4,pledge:0,peg:3.9,evEbitda:12.8,fcf:12000,wc:22000,altman:3.8,shortInt:0.6},
  {sym:'SUNPHARMA',name:'Sun Pharmaceutical Industries',sector:'Pharma',sub:'Pharmaceutical',cat:'Largecap',mcap:385000,price:1605.40,pe:38.5,pb:7.2,roe:18.8,roce:20.4,de:0.12,dy:0.88,rsi:60.2,g1:24.8,g3:22.5,g5:18.4,eg:28.5,pg:32.4,om:22.4,nm:16.8,cr:2.24,ph:54.48,fi:20.45,di:12.54,dii:14.8,vol:3012000,beta:0.72,h52:1963.2,l52:1125,pledge:0,peg:1.4,evEbitda:24.2,fcf:14500,wc:24000,altman:4.1,shortInt:0.5},
  {sym:'BAJFINANCE',name:'Bajaj Finance Ltd',sector:'Financial Services',sub:'Consumer Finance',cat:'Largecap',mcap:380000,price:6240.80,pe:32.4,pb:7.8,roe:24.8,roce:14.2,de:3.8,dy:0.32,rsi:52.4,g1:28.5,g3:32.4,g5:35.8,eg:30.2,pg:28.5,om:55.4,nm:22.8,cr:0.18,ph:55.92,fi:20.45,di:15.24,dii:10.2,vol:2154000,beta:1.35,h52:8192.2,l52:5488.1,pledge:0,peg:1.1,evEbitda:16.8,fcf:18000,wc:0,altman:2.8,shortInt:1.4},
  {sym:'MARUTI',name:'Maruti Suzuki India Ltd',sector:'Auto',sub:'Passenger Vehicles',cat:'Largecap',mcap:325000,price:10845.60,pe:26.8,pb:5.4,roe:20.4,roce:24.8,de:0.04,dy:0.88,rsi:65.4,g1:22.8,g3:18.5,g5:14.2,eg:38.5,pg:40.2,om:10.4,nm:8.2,cr:1.84,ph:58.19,fi:22.45,di:12.54,dii:16.2,vol:842000,beta:0.88,h52:13680,l52:9038,pledge:0,peg:0.7,evEbitda:14.5,fcf:12000,wc:18000,altman:4.5,shortInt:0.4},
  {sym:'NTPC',name:'NTPC Ltd',sector:'Power',sub:'Power Generation',cat:'Largecap',mcap:315000,price:325.40,pe:15.8,pb:2.2,roe:14.2,roce:10.8,de:1.85,dy:2.45,rsi:57.8,g1:12.4,g3:14.8,g5:12.5,eg:15.4,pg:18.2,om:28.4,nm:14.8,cr:0.84,ph:51.1,fi:14.85,di:22.45,dii:18.4,vol:18542000,beta:0.75,h52:448.4,l52:248.2,pledge:0,peg:1.0,evEbitda:10.2,fcf:22000,wc:8000,altman:2.2,shortInt:0.8},
  {sym:'HCLTECH',name:'HCL Technologies Ltd',sector:'IT',sub:'IT Services',cat:'Largecap',mcap:310000,price:1145.80,pe:24.8,pb:7.4,roe:29.8,roce:35.4,de:0.06,dy:3.12,rsi:53.2,g1:8.5,g3:12.4,g5:14.8,eg:10.8,pg:12.5,om:20.4,nm:16.8,cr:2.85,ph:60.81,fi:16.45,di:10.24,dii:12.8,vol:3254000,beta:0.78,h52:1493.5,l52:1035.6,pledge:0,peg:2.3,evEbitda:14.8,fcf:16000,wc:28000,altman:4.4,shortInt:0.5},
  {sym:'TITAN',name:'Titan Company Ltd',sector:'Consumer Goods',sub:'Jewellery',cat:'Largecap',mcap:295000,price:3318.40,pe:86.2,pb:24.4,roe:28.4,roce:34.8,de:0.14,dy:0.38,rsi:48.5,g1:18.5,g3:22.8,g5:20.4,eg:20.4,pg:22.5,om:10.8,nm:8.4,cr:1.84,ph:52.9,fi:18.45,di:12.24,dii:14.5,vol:1254000,beta:1.02,h52:3986.5,l52:2536.1,pledge:0,peg:4.2,evEbitda:52.4,fcf:8500,wc:14000,altman:5.2,shortInt:0.6},
  {sym:'ASIANPAINT',name:'Asian Paints Ltd',sector:'Consumer Goods',sub:'Paints',cat:'Largecap',mcap:245000,price:2558.40,pe:48.5,pb:14.8,roe:30.8,roce:38.4,de:0.08,dy:1.25,rsi:42.5,g1:-8.5,g3:8.4,g5:12.8,eg:-6.8,pg:-8.2,om:18.5,nm:14.8,cr:2.24,ph:52.63,fi:18.45,di:14.24,dii:16.2,vol:1845000,beta:0.82,h52:3294,l52:2025.6,pledge:0,peg:5.8,evEbitda:28.4,fcf:6800,wc:12000,altman:4.8,shortInt:0.7},
  {sym:'ONGC',name:'Oil & Natural Gas Corporation',sector:'Oil & Gas',sub:'E&P',cat:'Largecap',mcap:285000,price:226.80,pe:8.4,pb:0.98,roe:11.8,roce:12.4,de:0.42,dy:4.85,rsi:52.4,g1:5.8,g3:12.4,g5:8.5,eg:8.5,pg:10.2,om:35.4,nm:14.8,cr:0.84,ph:58.89,fi:8.45,di:28.45,dii:22.4,vol:18540000,beta:0.88,h52:350.3,l52:174.2,pledge:0,peg:1.0,evEbitda:5.8,fcf:28000,wc:12000,altman:2.8,shortInt:1.0},
  {sym:'DRREDDY',name:"Dr. Reddy's Laboratories",sector:'Pharma',sub:'Pharmaceutical',cat:'Largecap',mcap:185000,price:1108.40,pe:18.5,pb:4.2,roe:22.8,roce:26.4,de:0.08,dy:0.72,rsi:58.4,g1:15.4,g3:18.8,g5:15.4,eg:20.4,pg:22.5,om:22.4,nm:16.8,cr:2.54,ph:26.77,fi:24.45,di:18.24,dii:20.4,vol:1254000,beta:0.68,h52:1416.3,l52:895.3,pledge:0,peg:0.9,evEbitda:12.4,fcf:8200,wc:14000,altman:4.2,shortInt:0.4},
  {sym:'TATAMOTORS',name:'Tata Motors Ltd',sector:'Auto',sub:'Commercial Vehicles',cat:'Largecap',mcap:245000,price:656.40,pe:8.8,pb:3.4,roe:38.8,roce:14.2,de:2.8,dy:0.38,rsi:56.4,g1:28.5,g3:52.4,g5:18.5,eg:185.4,pg:210.5,om:12.8,nm:8.5,cr:0.84,ph:46.36,fi:18.45,di:28.45,dii:18.2,vol:12540000,beta:1.45,h52:1180,l52:602,pledge:2.5,peg:0.05,evEbitda:8.2,fcf:12000,wc:8000,altman:2.2,shortInt:2.4},
  // MIDCAP
  {sym:'ADANIPOWER',name:'Adani Power Ltd',sector:'Power',sub:'Power Generation',cat:'Midcap',mcap:128000,price:335.77,pe:15.6,pb:4.8,roe:32.4,roce:18.2,de:2.45,dy:0,rsi:52.8,g1:32.4,g3:28.5,g5:24.8,eg:85.4,pg:92.5,om:42.8,nm:28.4,cr:0.84,ph:72.88,fi:8.45,di:5.24,dii:6.2,vol:24512000,beta:1.45,h52:595,l52:248.2,pledge:18.24,peg:0.2,evEbitda:6.4,fcf:8500,wc:4000,altman:1.8,shortInt:3.2},
  {sym:'POLYCAB',name:'Polycab India Ltd',sector:'Electrical',sub:'Cables & Wires',cat:'Midcap',mcap:78000,price:5232.50,pe:42.1,pb:8.8,roe:21.4,roce:26.8,de:0.18,dy:0.58,rsi:62.4,g1:22.8,g3:24.5,g5:28.4,eg:30.5,pg:32.4,om:12.8,nm:9.4,cr:1.84,ph:67.89,fi:12.45,di:8.24,dii:10.4,vol:542000,beta:0.98,h52:7605,l52:3960,pledge:0,peg:1.4,evEbitda:26.4,fcf:4200,wc:8000,altman:4.2,shortInt:0.8},
  {sym:'MAXHEALTH',name:'Max Healthcare Institute Ltd',sector:'Healthcare',sub:'Hospitals',cat:'Midcap',mcap:72000,price:848.40,pe:85.4,pb:15.2,roe:18.4,roce:14.8,de:0.28,dy:0,rsi:58.2,g1:28.5,g3:32.4,g5:35.8,eg:42.5,pg:48.2,om:18.5,nm:12.8,cr:1.54,ph:47.21,fi:24.85,di:18.45,dii:14.2,vol:1254000,beta:0.78,h52:1048,l52:618,pledge:0,peg:2.0,evEbitda:48.2,fcf:2800,wc:4200,altman:3.8,shortInt:0.6},
  {sym:'TORNTPHARM',name:'Torrent Pharmaceuticals Ltd',sector:'Pharma',sub:'Pharmaceutical',cat:'Midcap',mcap:48000,price:2842.50,pe:45.8,pb:9.2,roe:20.4,roce:18.8,de:0.58,dy:1.12,rsi:60.8,g1:18.5,g3:15.4,g5:12.8,eg:22.4,pg:24.5,om:22.4,nm:16.8,cr:1.84,ph:71.24,fi:8.45,di:10.24,dii:12.4,vol:458000,beta:0.65,h52:3400,l52:1930,pledge:0,peg:2.0,evEbitda:28.4,fcf:2400,wc:4800,altman:3.6,shortInt:0.5},
  {sym:'INDHOTEL',name:'Indian Hotels Company Ltd',sector:'Consumer Services',sub:'Hotels',cat:'Midcap',mcap:62000,price:434.80,pe:58.4,pb:7.8,roe:13.8,roce:10.4,de:0.88,dy:0.34,rsi:62.5,g1:24.8,g3:22.4,g5:18.8,eg:42.5,pg:48.2,om:22.8,nm:14.5,cr:0.84,ph:38.12,fi:24.85,di:22.45,dii:18.4,vol:3254000,beta:1.22,h52:626.8,l52:355.9,pledge:0,peg:1.4,evEbitda:32.4,fcf:1800,wc:2400,altman:3.2,shortInt:1.0},
  {sym:'CUMMINSIND',name:'Cummins India Ltd',sector:'Capital Goods',sub:'Industrial Machinery',cat:'Midcap',mcap:42000,price:3498.40,pe:52.8,pb:14.8,roe:28.4,roce:34.8,de:0,dy:1.45,rsi:58.5,g1:28.4,g3:24.8,g5:20.4,eg:34.5,pg:38.2,om:18.5,nm:15.4,cr:2.84,ph:51,fi:14.85,di:18.45,dii:16.2,vol:485000,beta:0.88,h52:4266,l52:1876,pledge:0,peg:1.5,evEbitda:32.8,fcf:2200,wc:4800,altman:5.2,shortInt:0.4},
  {sym:'PIIND',name:'PI Industries Ltd',sector:'Chemicals',sub:'Agro Chemicals',cat:'Midcap',mcap:38000,price:2845.40,pe:36.8,pb:8.8,roe:24.8,roce:28.4,de:0.08,dy:0.28,rsi:52.4,g1:12.4,g3:22.8,g5:28.5,eg:18.5,pg:20.4,om:20.4,nm:16.8,cr:2.84,ph:51.7,fi:18.45,di:12.24,dii:14.8,vol:345000,beta:0.82,h52:4150,l52:2650,pledge:0,peg:2.0,evEbitda:22.4,fcf:1800,wc:3600,altman:4.8,shortInt:0.5},
  {sym:'MPHASIS',name:'Mphasis Ltd',sector:'IT',sub:'IT Services',cat:'Midcap',mcap:45000,price:2380.40,pe:36.8,pb:8.4,roe:22.8,roce:28.4,de:0.04,dy:1.85,rsi:55.4,g1:5.8,g3:18.4,g5:22.8,eg:8.5,pg:9.2,om:18.5,nm:14.8,cr:3.24,ph:55.47,fi:24.45,di:12.24,dii:10.8,vol:254000,beta:1.12,h52:3239,l52:1874,pledge:0,peg:4.3,evEbitda:22.8,fcf:1600,wc:3200,altman:4.4,shortInt:0.6},
  // SMALLCAP
  {sym:'SEAMEC',name:'Seamec Ltd',sector:'Oil & Gas',sub:'Oil & Gas Equipment',cat:'Smallcap',mcap:3664,price:1420.50,pe:30.56,pb:4.8,roe:15.8,roce:18.4,de:0.08,dy:0,rsi:62.4,g1:55.91,g3:42.5,g5:35.8,eg:58.5,pg:62.4,om:32.4,nm:24.8,cr:2.84,ph:75,fi:2.45,di:1.24,dii:2.4,vol:85000,beta:1.45,h52:1995,l52:895,pledge:0,peg:0.5,evEbitda:12.4,fcf:280,wc:480,altman:3.8,shortInt:1.2},
  {sym:'WHEELS',name:'Wheels India Ltd',sector:'Auto Parts',sub:'Auto Components',cat:'Smallcap',mcap:3640,price:1410.20,pe:18.83,pb:3.2,roe:17.4,roce:20.8,de:0.45,dy:0.88,rsi:55.4,g1:19.54,g3:15.8,g5:12.4,eg:22.5,pg:24.8,om:10.8,nm:7.4,cr:1.54,ph:60.8,fi:4.45,di:2.24,dii:4.8,vol:25000,beta:0.98,h52:2056,l52:1048,pledge:0,peg:0.8,evEbitda:10.8,fcf:240,wc:420,altman:3.4,shortInt:0.8},
  {sym:'INDOTECH',name:'Indo Tech Transformers',sector:'Electrical',sub:'Heavy Electrical',cat:'Smallcap',mcap:3607,price:3472.60,pe:30.56,pb:5.8,roe:19.8,roce:22.4,de:0.18,dy:0.58,rsi:68.4,g1:55.91,g3:48.5,g5:42.4,eg:60.5,pg:64.8,om:18.5,nm:12.8,cr:2.54,ph:72,fi:1.85,di:0.84,dii:2.2,vol:15000,beta:1.12,h52:5250,l52:1842,pledge:0,peg:0.5,evEbitda:18.4,fcf:180,wc:320,altman:4.2,shortInt:0.6},
  {sym:'NITINSPIN',name:'Nitin Spinners Ltd',sector:'Textiles',sub:'Synthetic Textiles',cat:'Smallcap',mcap:3167,price:554.70,pe:14.63,pb:2.4,roe:16.8,roce:18.4,de:0.88,dy:1.25,rsi:48.5,g1:12.05,g3:10.4,g5:8.5,eg:15.4,pg:18.2,om:12.5,nm:7.8,cr:1.24,ph:74.05,fi:0.85,di:0.54,dii:1.8,vol:125000,beta:0.75,h52:742,l52:434,pledge:5.8,peg:0.9,evEbitda:8.4,fcf:220,wc:380,altman:2.8,shortInt:1.4},
  {sym:'SPECTRUM',name:'Spectrum Electrical Industries',sector:'Electrical',sub:'Electrical Components',cat:'Smallcap',mcap:3151,price:2012.40,pe:28.25,pb:6.4,roe:22.8,roce:26.4,de:0.24,dy:0.44,rsi:72.5,g1:32.98,g3:28.5,g5:24.8,eg:38.5,pg:42.4,om:18.5,nm:12.8,cr:2.24,ph:68,fi:2.45,di:1.24,dii:2.8,vol:35000,beta:1.35,h52:3256,l52:1256,pledge:0,peg:0.7,evEbitda:16.8,fcf:160,wc:280,altman:4.0,shortInt:0.8},
  {sym:'SATIN',name:'Satin Creditcare Network',sector:'Financial Services',sub:'Microfinance',cat:'Smallcap',mcap:2940,price:264.66,pe:17.28,pb:2.2,roe:12.8,roce:7.4,de:5.8,dy:0,rsi:55.4,g1:164.51,g3:85.4,g5:42.8,eg:180.5,pg:195.2,om:55.4,nm:18.5,cr:0.24,ph:53,fi:8.45,di:4.24,dii:6.2,vol:285000,beta:1.58,h52:385,l52:165,pledge:18.5,peg:0.1,evEbitda:6.2,fcf:120,wc:0,altman:1.4,shortInt:4.2},
  {sym:'SANGAMIND',name:'Sangam (India) Ltd',sector:'Textiles',sub:'Integrated Textiles',cat:'Smallcap',mcap:3070,price:624.95,pe:18.83,pb:2.8,roe:15.4,roce:18.2,de:0.65,dy:1.45,rsi:52.5,g1:19.54,g3:15.8,g5:12.5,eg:22.5,pg:24.8,om:12.5,nm:8.4,cr:1.54,ph:67,fi:1.85,di:0.84,dii:2.4,vol:85000,beta:0.88,h52:915,l52:498,pledge:0,peg:0.8,evEbitda:10.4,fcf:200,wc:360,altman:3.2,shortInt:0.6},
  {sym:'SPAPPARELS',name:'S.P.Apparels Ltd',sector:'Apparel',sub:'Readymade Garments',cat:'Smallcap',mcap:2828,price:1121.60,pe:19.56,pb:3.8,roe:19.8,roce:22.4,de:0.28,dy:0.88,rsi:60.4,g1:16.78,g3:18.4,g5:15.8,eg:22.5,pg:24.8,om:14.5,nm:10.8,cr:2.24,ph:70,fi:2.45,di:1.24,dii:2.8,vol:45000,beta:0.88,h52:1845,l52:798,pledge:0,peg:0.9,evEbitda:12.4,fcf:180,wc:320,altman:3.8,shortInt:0.5},
  {sym:'RAILSYS',name:'Rail Vikas Nigam Ltd',sector:'Capital Goods',sub:'Railway Construction',cat:'Smallcap',mcap:8520,price:204.80,pe:34.8,pb:8.2,roe:24.8,roce:18.4,de:0.08,dy:1.25,rsi:58.4,g1:45.4,g3:38.5,g5:32.4,eg:48.5,pg:52.4,om:8.5,nm:6.4,cr:1.24,ph:72.84,fi:8.45,di:5.24,dii:6.8,vol:8540000,beta:1.18,h52:647,l52:173.2,pledge:0,peg:0.7,evEbitda:22.4,fcf:480,wc:820,altman:3.4,shortInt:1.2},
  {sym:'ELPROINT',name:'Elpro International Ltd',sector:'Electrical',sub:'Transformers',cat:'Smallcap',mcap:2946,price:174.15,pe:49.64,pb:3.8,roe:7.8,roce:9.4,de:0.28,dy:0.58,rsi:60.5,g1:36.81,g3:28.5,g5:24.8,eg:42.5,pg:48.2,om:14.5,nm:9.8,cr:1.84,ph:72,fi:1.85,di:0.84,dii:1.6,vol:125000,beta:1.12,h52:256,l52:118,pledge:0,peg:1.2,evEbitda:28.4,fcf:120,wc:220,altman:2.8,shortInt:0.8},
  {sym:'KTKBANK',name:'Karnataka Bank Ltd',sector:'Banking',sub:'Private Banks',cat:'Smallcap',mcap:4820,price:191.80,pe:8.4,pb:0.92,roe:11.4,roce:6.2,de:11.8,dy:2.85,rsi:45.8,g1:8.5,g3:12.4,g5:6.8,eg:12.5,pg:14.8,om:38.5,nm:14.8,cr:0.08,ph:0,fi:4.85,di:12.24,dii:8.4,vol:1254000,beta:0.85,h52:298,l52:148,pledge:0,peg:0.7,evEbitda:5.4,fcf:320,wc:0,altman:1.6,shortInt:1.8},
]

const INIT_FILTERS = {
  cap:'All', sectors:[],
  pMin:'',pMax:'', mcMin:'',mcMax:'',
  peMin:'',peMax:'', pbMin:'',pbMax:'',
  roeMin:'',roeMax:'', roceMin:'',
  deMax:'', dyMin:'',
  rsiMin:'',rsiMax:'',
  g1Min:'',g3Min:'',g5Min:'',
  egMin:'',pgMin:'',
  phMin:'',phMax:'',
  fiMin:'',fiMax:'',
  diiMin:'',diiMax:'',
  volMin:'',
  betaMin:'',betaMax:'',
  nmMin:'',omMin:'',crMin:'',
  pledgeMax:'',
  h52PctMax:'',
  l52PctMin:'',
  pegMax:'',
  evEbitdaMax:'',
  macdSignal:'',
  smaSignal:'',
  fcfMin:'',
  wcMin:'',
  altmanMin:'',
  shortIntMax:'',
}

function Sec({ title, children, badge=0 }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{borderBottom:`1px solid ${C.gray100}`}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
        padding:'9px 0',cursor:'pointer',userSelect:'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11.5,fontWeight:800,color:C.gray800}}>
          {title}
          {badge>0&&<span style={{minWidth:16,height:16,borderRadius:8,background:C.blue,color:'#fff',
            fontSize:9,fontWeight:900,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:'0 4px'}}>{badge}</span>}
        </div>
        {open?<ChevronUp size={13} color={C.gray400}/>:<ChevronDown size={13} color={C.gray400}/>}
      </div>
      {open&&<div style={{paddingBottom:12}}>{children}</div>}
    </div>
  )
}

function RangeRow({ minK, maxK, f, up, unit='' }) {
  const inp = {padding:'5px 7px',borderRadius:4,border:`1px solid ${C.gray200}`,fontSize:11,outline:'none',width:'100%',boxSizing:'border-box'}
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5,marginTop:6}}>
      <input type="number" placeholder={`Min${unit}`} value={f[minK]||''} onChange={e=>up({[minK]:e.target.value})} style={inp}/>
      <input type="number" placeholder={`Max${unit}`} value={f[maxK]||''} onChange={e=>up({[maxK]:e.target.value})} style={inp}/>
    </div>
  )
}
function MinRow({ minK, f, up, ph='Min' }) {
  return <input type="number" placeholder={ph} value={f[minK]||''} onChange={e=>up({[minK]:e.target.value})}
    style={{padding:'5px 7px',borderRadius:4,border:`1px solid ${C.gray200}`,fontSize:11,outline:'none',width:'100%',boxSizing:'border-box',marginTop:6}}/>
}
function MaxRow({ maxK, f, up, ph='Max' }) {
  return <input type="number" placeholder={ph} value={f[maxK]||''} onChange={e=>up({[maxK]:e.target.value})}
    style={{padding:'5px 7px',borderRadius:4,border:`1px solid ${C.gray200}`,fontSize:11,outline:'none',width:'100%',boxSizing:'border-box',marginTop:6}}/>
}

const lbl = {fontSize:10.5,color:C.gray600,fontWeight:700,marginTop:8,display:'block'}

const SCREENS = [
  {name:'Wealth Compounders',sym:'✳️',desc:'High-quality stocks with sustained growth and profitability',users:'103k+ users',filters:{roeMin:'15',g3Min:'12'}},
  {name:'Dividend Gems',sym:'💰',desc:'High dividend yield companies with consistent payout track record',users:'34k+ users',filters:{dyMin:'2.5'}},
  {name:'Cash Rich Smallcaps',sym:'🪙',desc:'Profitable smallcap companies with growing cash flow',users:'114k+ users',filters:{cap:'Smallcap',crMin:'1.5'}},
  {name:'Near 52W Lows',sym:'📉',desc:'Fundamentally strong stocks near their 52-week low',users:'115k+ users',filters:{peMin:'5',peMax:'25'}},
  {name:'Momentum Monsters',sym:'⚡',desc:'Companies experiencing strong price momentum',users:'89k+ users',filters:{rsiMin:'60'}},
  {name:'High ROE Compounders',sym:'🌿',desc:'Stocks with consistently high return on equity',users:'76k+ users',filters:{roeMin:'20',g5Min:'10'}},
  {name:'Hidden Gems',sym:'💎',desc:'Undervalued stocks with strong fundamentals',users:'56k+ users',filters:{peMax:'20',roeMin:'15'}},
  {name:'Analyst Backed Bets',sym:'📊',desc:'High conviction stocks with strong analyst consensus',users:'112k+ users',filters:{g3Min:'15'}},
  {name:'Penny Picks',sym:'⚙️',desc:'High potential microcaps under strong fundamentals',users:'61k+ users',filters:{cap:'Smallcap',peMax:'20'}},
]

export default function ScreenerPage({ onSelectStock }) {
  const [view, setView] = useState('collections')
  const [screenName, setScreenName] = useState('Wealth Compounders')
  const [f, setF] = useState(INIT_FILTERS)
  const [sort, setSort] = useState({field:'mcap',dir:'desc'})
  const [bm, setBm] = useState({})
  const [search, setSearch] = useState('')

  const upF = patch => setF(p=>({...p,...patch}))

  const activeCount = useMemo(()=>{
    let n=0
    if(f.cap!=='All')n++; if(f.sectors.length)n++
    if(f.pMin||f.pMax)n++; if(f.mcMin||f.mcMax)n++
    if(f.peMin||f.peMax)n++; if(f.pbMin||f.pbMax)n++
    if(f.roeMin||f.roeMax)n++; if(f.roceMin)n++
    if(f.deMax)n++; if(f.dyMin)n++
    if(f.rsiMin||f.rsiMax)n++
    if(f.g1Min)n++; if(f.g3Min)n++; if(f.g5Min)n++
    if(f.egMin)n++; if(f.pgMin)n++
    if(f.phMin||f.phMax)n++; if(f.fiMin||f.fiMax)n++
    if(f.diiMin||f.diiMax)n++
    if(f.volMin)n++; if(f.betaMin||f.betaMax)n++
    if(f.nmMin)n++; if(f.omMin)n++; if(f.crMin)n++; if(f.pledgeMax)n++
    if(f.h52PctMax)n++; if(f.l52PctMin)n++
    if(f.pegMax)n++; if(f.evEbitdaMax)n++
    if(f.macdSignal)n++; if(f.smaSignal)n++
    if(f.fcfMin)n++; if(f.wcMin)n++
    if(f.altmanMin)n++; if(f.shortIntMax)n++
    return n
  },[f])

  const results = useMemo(()=>{
    let list = STOCKS.filter(s=>{
      if(f.cap!=='All'&&s.cat!==f.cap)return false
      if(f.sectors.length&&!f.sectors.includes(s.sector))return false
      if(search&&!s.name.toLowerCase().includes(search.toLowerCase())&&!s.sym.toLowerCase().includes(search.toLowerCase()))return false
      const n=(k,v)=>v!==''&&!isNaN(v)
      if(n('pMin',f.pMin)&&s.price<+f.pMin)return false
      if(n('pMax',f.pMax)&&s.price>+f.pMax)return false
      if(n('mcMin',f.mcMin)&&s.mcap<+f.mcMin)return false
      if(n('mcMax',f.mcMax)&&s.mcap>+f.mcMax)return false
      if(n('peMin',f.peMin)&&s.pe<+f.peMin)return false
      if(n('peMax',f.peMax)&&s.pe>+f.peMax)return false
      if(n('pbMin',f.pbMin)&&s.pb<+f.pbMin)return false
      if(n('pbMax',f.pbMax)&&s.pb>+f.pbMax)return false
      if(n('roeMin',f.roeMin)&&s.roe<+f.roeMin)return false
      if(n('roeMax',f.roeMax)&&s.roe>+f.roeMax)return false
      if(n('roceMin',f.roceMin)&&s.roce<+f.roceMin)return false
      if(n('deMax',f.deMax)&&s.de>+f.deMax)return false
      if(n('dyMin',f.dyMin)&&s.dy<+f.dyMin)return false
      if(n('rsiMin',f.rsiMin)&&s.rsi<+f.rsiMin)return false
      if(n('rsiMax',f.rsiMax)&&s.rsi>+f.rsiMax)return false
      if(n('g1Min',f.g1Min)&&s.g1<+f.g1Min)return false
      if(n('g3Min',f.g3Min)&&s.g3<+f.g3Min)return false
      if(n('g5Min',f.g5Min)&&s.g5<+f.g5Min)return false
      if(n('egMin',f.egMin)&&s.eg<+f.egMin)return false
      if(n('pgMin',f.pgMin)&&s.pg<+f.pgMin)return false
      if(n('phMin',f.phMin)&&s.ph<+f.phMin)return false
      if(n('phMax',f.phMax)&&s.ph>+f.phMax)return false
      if(n('fiMin',f.fiMin)&&s.fi<+f.fiMin)return false
      if(n('fiMax',f.fiMax)&&s.fi>+f.fiMax)return false
      if(n('volMin',f.volMin)&&s.vol<+f.volMin)return false
      if(n('betaMin',f.betaMin)&&s.beta<+f.betaMin)return false
      if(n('betaMax',f.betaMax)&&s.beta>+f.betaMax)return false
      if(n('nmMin',f.nmMin)&&s.nm<+f.nmMin)return false
      if(n('omMin',f.omMin)&&s.om<+f.omMin)return false
      if(n('crMin',f.crMin)&&s.cr<+f.crMin)return false
      if(n('pledgeMax',f.pledgeMax)&&s.pledge>+f.pledgeMax)return false
      // new filters
      if(n('diiMin',f.diiMin)&&s.dii<+f.diiMin)return false
      if(n('diiMax',f.diiMax)&&s.dii>+f.diiMax)return false
      if(n('h52PctMax',f.h52PctMax)&&((s.h52-s.price)/s.h52*100)>+f.h52PctMax)return false
      if(n('l52PctMin',f.l52PctMin)&&((s.price-s.l52)/s.l52*100)<+f.l52PctMin)return false
      if(n('pegMax',f.pegMax)&&s.peg>+f.pegMax)return false
      if(n('evEbitdaMax',f.evEbitdaMax)&&s.evEbitda>+f.evEbitdaMax)return false
      if(f.macdSignal==='bullish'&&s.rsi<50)return false
      if(f.macdSignal==='bearish'&&s.rsi>=50)return false
      if(f.smaSignal==='above'&&s.price<s.l52*1.1)return false
      if(f.smaSignal==='below'&&s.price>s.h52*0.9)return false
      if(n('fcfMin',f.fcfMin)&&s.fcf<+f.fcfMin)return false
      if(n('wcMin',f.wcMin)&&s.wc<+f.wcMin)return false
      if(n('altmanMin',f.altmanMin)&&s.altman<+f.altmanMin)return false
      if(n('shortIntMax',f.shortIntMax)&&s.shortInt>+f.shortIntMax)return false
      return true
    })
    list.sort((a,b)=>{
      const av=a[sort.field],bv=b[sort.field]
      return sort.dir==='asc'?av-bv:bv-av
    })
    return list
  },[f,sort,search])

  const doSort = field => setSort(s=>({field,dir:s.field===field&&s.dir==='desc'?'asc':'desc'}))
  const SortIcon = ({field}) => sort.field===field?(sort.dir==='desc'?'▼':'▲'):''

  const toggleSector = s => upF({sectors: f.sectors.includes(s)?f.sectors.filter(x=>x!==s):[...f.sectors,s]})

  const applyScreen = sc => {
    setF({...INIT_FILTERS,...sc.filters})
    setScreenName(sc.name)
    setView('interactive')
  }

  // Collections view
  if(view==='collections') return (
    <div style={{background:C.gray50,minHeight:'100vh',padding:'28px 16px'}}>
      <div style={{maxWidth:1120,margin:'0 auto'}}>
        <div style={{background:'#fff',border:`1.5px solid ${C.gray200}`,borderRadius:8,padding:22,
          display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28}}>
          <div>
            <h2 style={{fontSize:16,fontWeight:900,color:C.gray800}}>Stock Screener · 30+ Filters</h2>
            <p style={{fontSize:12.5,color:C.gray600,marginTop:4}}>Filter across {STOCKS.length} stocks using fundamentals, technicals, ownership, and more.</p>
          </div>
          <button onClick={()=>{setF(INIT_FILTERS);setScreenName('Custom Screen');setView('interactive')}}
            style={{padding:'10px 20px',borderRadius:4,background:C.navy,color:'#fff',fontSize:12.5,fontWeight:750,border:'none',cursor:'pointer'}}>
            + Create New Screen
          </button>
        </div>

        {[
          {title:'Popular Screens', items: SCREENS.slice(0,6)},
          {title:'Fundamental Screens', items: SCREENS.slice(6)},
        ].map(group=>(
          <div key={group.title} style={{marginBottom:28}}>
            <h3 style={{fontSize:15,fontWeight:850,color:C.gray800,marginBottom:14}}>{group.title}</h3>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
              {group.items.map(s=>(
                <div key={s.name} onClick={()=>applyScreen(s)}
                  style={{background:'#fff',border:`1.5px solid ${C.gray200}`,borderRadius:6,padding:18,
                    cursor:'pointer',transition:'border-color .15s',minHeight:160,display:'flex',flexDirection:'column',justifyContent:'space-between'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray200}>
                  <div>
                    <div style={{fontSize:20,marginBottom:6}}>{s.sym}</div>
                    <h4 style={{fontSize:13,fontWeight:800,color:C.gray800}}>{s.name}</h4>
                    <p style={{fontSize:11.5,color:C.gray600,marginTop:6,lineHeight:1.4}}>{s.desc}</p>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                    borderTop:`1px solid ${C.gray100}`,paddingTop:10,marginTop:12}}>
                    <span style={{fontSize:10.5,color:C.gray400}}>{s.users}</span>
                    <span style={{fontSize:12,color:C.blue}}>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // Interactive Filter + Results View
  return (
    <div style={{background:C.white,minHeight:'100vh',display:'grid',gridTemplateColumns:'256px 1fr'}}>

      {/* ─── Sidebar ─── */}
      <div style={{borderRight:`1.5px solid ${C.gray200}`,padding:'16px 14px',overflowY:'auto',maxHeight:'100vh',position:'sticky',top:0}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:750,color:C.gray600}}>
            {activeCount>0?`${activeCount} filter${activeCount>1?'s':''} active`:'No filters'}
          </span>
          <button onClick={()=>setF(INIT_FILTERS)} style={{fontSize:11,fontWeight:800,color:C.gray400,background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
            <RefreshCw size={11}/> Reset
          </button>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:0}}>

          {/* Cap Category */}
          <Sec title="Cap Category" badge={f.cap!=='All'?1:0}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
              {['All','Largecap','Midcap','Smallcap'].map(c=>(
                <button key={c} onClick={()=>upF({cap:c})} style={{padding:'5px 4px',borderRadius:4,fontSize:10,fontWeight:800,
                  background:f.cap===c?C.blueBg:C.white,color:f.cap===c?C.blue:C.gray600,
                  border:`1px solid ${f.cap===c?C.blue:C.gray200}`,cursor:'pointer'}}>{c}</button>
              ))}
            </div>
          </Sec>

          {/* Sector */}
          <Sec title="Sector" badge={f.sectors.length}>
            <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
              {SECTORS.map(s=>(
                <button key={s} onClick={()=>toggleSector(s)} style={{padding:'3px 7px',borderRadius:10,fontSize:9.5,fontWeight:700,
                  background:f.sectors.includes(s)?C.blueBg:C.white,color:f.sectors.includes(s)?C.blue:C.gray600,
                  border:`1px solid ${f.sectors.includes(s)?C.blue:C.gray200}`,cursor:'pointer'}}>{s}</button>
              ))}
            </div>
          </Sec>

          {/* Price & Market Cap */}
          <Sec title="Price & Market Cap" badge={(f.pMin||f.pMax||f.mcMin||f.mcMax)?1:0}>
            <span style={lbl}>Close Price (₹)</span>
            <RangeRow minK="pMin" maxK="pMax" f={f} up={upF}/>
            <span style={lbl}>Market Cap (Cr)</span>
            <RangeRow minK="mcMin" maxK="mcMax" f={f} up={upF}/>
          </Sec>

          {/* Valuation */}
          <Sec title="Valuation Ratios" badge={(f.peMin||f.peMax||f.pbMin||f.pbMax)?1:0}>
            <span style={lbl}>PE Ratio</span>
            <RangeRow minK="peMin" maxK="peMax" f={f} up={upF}/>
            <span style={lbl}>PB Ratio</span>
            <RangeRow minK="pbMin" maxK="pbMax" f={f} up={upF}/>
          </Sec>

          {/* Profitability */}
          <Sec title="Profitability" badge={(f.roeMin||f.roeMax||f.roceMin||f.nmMin||f.omMin)?1:0}>
            <span style={lbl}>ROE (%)</span>
            <RangeRow minK="roeMin" maxK="roeMax" f={f} up={upF}/>
            <span style={lbl}>ROCE (%) — Min</span>
            <MinRow minK="roceMin" f={f} up={upF} ph="Min ROCE %"/>
            <span style={lbl}>Operating Margin (%) — Min</span>
            <MinRow minK="omMin" f={f} up={upF} ph="Min Op. Margin %"/>
            <span style={lbl}>Net Margin (%) — Min</span>
            <MinRow minK="nmMin" f={f} up={upF} ph="Min Net Margin %"/>
          </Sec>

          {/* Financial Health */}
          <Sec title="Financial Health" badge={(f.deMax||f.crMin)?1:0}>
            <span style={lbl}>Debt / Equity — Max</span>
            <MaxRow maxK="deMax" f={f} up={upF} ph="Max D/E ratio"/>
            <span style={lbl}>Current Ratio — Min</span>
            <MinRow minK="crMin" f={f} up={upF} ph="Min current ratio"/>
          </Sec>

          {/* Dividends */}
          <Sec title="Dividends" badge={f.dyMin?1:0}>
            <span style={lbl}>Dividend Yield (%) — Min</span>
            <MinRow minK="dyMin" f={f} up={upF} ph="Min div. yield %"/>
          </Sec>

          {/* Growth */}
          <Sec title="Revenue Growth" badge={(f.g1Min||f.g3Min||f.g5Min)?1:0}>
            <span style={lbl}>1Y Revenue Growth (%) — Min</span>
            <MinRow minK="g1Min" f={f} up={upF} ph="Min 1Y growth %"/>
            <span style={lbl}>3Y Revenue Growth (%) — Min</span>
            <MinRow minK="g3Min" f={f} up={upF} ph="Min 3Y growth %"/>
            <span style={lbl}>5Y Revenue Growth (%) — Min</span>
            <MinRow minK="g5Min" f={f} up={upF} ph="Min 5Y growth %"/>
          </Sec>

          {/* EPS & Profit Growth */}
          <Sec title="EPS & Profit Growth" badge={(f.egMin||f.pgMin)?1:0}>
            <span style={lbl}>EPS Growth (%) — Min</span>
            <MinRow minK="egMin" f={f} up={upF} ph="Min EPS growth %"/>
            <span style={lbl}>Profit Growth (%) — Min</span>
            <MinRow minK="pgMin" f={f} up={upF} ph="Min profit growth %"/>
          </Sec>

          {/* Ownership */}
          <Sec title="Ownership Pattern" badge={(f.phMin||f.phMax||f.fiMin||f.fiMax||f.diiMin||f.diiMax)?1:0}>
            <span style={lbl}>Promoter Holding (%)</span>
            <RangeRow minK="phMin" maxK="phMax" f={f} up={upF}/>
            <span style={lbl}>FII Holding (%)</span>
            <RangeRow minK="fiMin" maxK="fiMax" f={f} up={upF}/>
            <span style={lbl}>DII Holding (%)</span>
            <RangeRow minK="diiMin" maxK="diiMax" f={f} up={upF}/>
            <span style={lbl}>Promoter Pledge (%) — Max</span>
            <MaxRow maxK="pledgeMax" f={f} up={upF} ph="Max pledge %"/>
          </Sec>

          {/* Volume */}
          <Sec title="Volume" badge={f.volMin?1:0}>
            <span style={lbl}>Volume — Min</span>
            <MinRow minK="volMin" f={f} up={upF} ph="Min daily volume"/>
          </Sec>

          {/* 52W Position */}
          <Sec title="52-Week Position" badge={(f.h52PctMax||f.l52PctMin)?1:0}>
            <span style={lbl}>% Below 52W High — Max</span>
            <MaxRow maxK="h52PctMax" f={f} up={upF} ph="e.g. 20 = within 20% of high"/>
            <span style={lbl}>% Above 52W Low — Min</span>
            <MinRow minK="l52PctMin" f={f} up={upF} ph="e.g. 10 = at least 10% above low"/>
          </Sec>

          {/* Valuation Advanced */}
          <Sec title="Advanced Valuation" badge={(f.pegMax||f.evEbitdaMax)?1:0}>
            <span style={lbl}>PEG Ratio — Max</span>
            <MaxRow maxK="pegMax" f={f} up={upF} ph="Max PEG ratio"/>
            <span style={lbl}>EV/EBITDA — Max</span>
            <MaxRow maxK="evEbitdaMax" f={f} up={upF} ph="Max EV/EBITDA"/>
          </Sec>

          {/* Technical Signals */}
          <Sec title="Technical Signals" badge={(f.macdSignal||f.smaSignal||f.rsiMin||f.rsiMax||f.betaMin||f.betaMax)?1:0}>
            <span style={lbl}>RSI (14D)</span>
            <RangeRow minK="rsiMin" maxK="rsiMax" f={f} up={upF}/>
            <span style={lbl}>Beta</span>
            <RangeRow minK="betaMin" maxK="betaMax" f={f} up={upF}/>
            <span style={lbl}>MACD Signal</span>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4,marginTop:6}}>
              {['','bullish','bearish'].map(v=>(
                <button key={v} onClick={()=>upF({macdSignal:v})} style={{padding:'4px 2px',borderRadius:4,fontSize:9.5,fontWeight:800,
                  background:f.macdSignal===v?'#EEF3FF':'#fff',color:f.macdSignal===v?'#2563EB':'#5A6478',
                  border:`1px solid ${f.macdSignal===v?'#2563EB':'#E4E7EC'}`,cursor:'pointer'}}>
                  {v===''?'Any':v.charAt(0).toUpperCase()+v.slice(1)}
                </button>
              ))}
            </div>
            <span style={lbl}>Price vs SMA</span>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:4,marginTop:6}}>
              {['','above','below'].map(v=>(
                <button key={v} onClick={()=>upF({smaSignal:v})} style={{padding:'4px 2px',borderRadius:4,fontSize:9.5,fontWeight:800,
                  background:f.smaSignal===v?'#EEF3FF':'#fff',color:f.smaSignal===v?'#2563EB':'#5A6478',
                  border:`1px solid ${f.smaSignal===v?'#2563EB':'#E4E7EC'}`,cursor:'pointer'}}>
                  {v===''?'Any':v==='above'?'Above SMA':'Below SMA'}
                </button>
              ))}
            </div>
          </Sec>

          {/* Cash Flow & Working Capital */}
          <Sec title="Cash Flow & Working Capital" badge={(f.fcfMin||f.wcMin)?1:0}>
            <span style={lbl}>Free Cash Flow (Cr) — Min</span>
            <MinRow minK="fcfMin" f={f} up={upF} ph="Min FCF in Cr"/>
            <span style={lbl}>Working Capital (Cr) — Min</span>
            <MinRow minK="wcMin" f={f} up={upF} ph="Min working capital"/>
          </Sec>

          {/* Risk Metrics */}
          <Sec title="Risk Metrics" badge={(f.altmanMin||f.shortIntMax)?1:0}>
            <span style={lbl}>Altman Z-Score — Min (3+ = safe)</span>
            <MinRow minK="altmanMin" f={f} up={upF} ph="Min Z-score"/>
            <span style={lbl}>Short Interest (%) — Max</span>
            <MaxRow maxK="shortIntMax" f={f} up={upF} ph="Max short interest %"/>
          </Sec>

          <button onClick={()=>setView('collections')} style={{width:'100%',padding:'9px 0',border:`1px solid ${C.gray200}`,
            background:'#fff',color:C.gray600,fontSize:11.5,fontWeight:700,borderRadius:4,cursor:'pointer',marginTop:12}}>
            ← Back to Screens
          </button>
        </div>
      </div>

      {/* ─── Results Panel ─── */}
      <div style={{padding:'20px 20px',overflowY:'auto'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,
          borderBottom:`1.5px solid ${C.gray200}`,paddingBottom:14}}>
          <div>
            <h2 style={{fontSize:17,fontWeight:900,color:C.gray800,display:'flex',alignItems:'center',gap:8}}>
              {screenName}
              <button onClick={()=>setScreenName('Custom Screen')} style={{background:'none',border:'none',cursor:'pointer',fontSize:14}}>✏️</button>
            </h2>
            <p style={{fontSize:12,color:C.gray400,marginTop:3}}>
              {activeCount>0?`${activeCount} filters applied · `:''}Showing {results.length} of {STOCKS.length} stocks
            </p>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <div style={{position:'relative'}}>
              <Search size={12} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:C.gray400}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stocks..."
                style={{padding:'7px 10px 7px 26px',borderRadius:6,border:`1px solid ${C.gray200}`,fontSize:12,outline:'none',width:180}}/>
            </div>
            <button style={{padding:'7px 14px',borderRadius:4,border:`1px solid ${C.gray200}`,background:'#fff',color:C.gray600,fontSize:11.5,fontWeight:700,cursor:'pointer'}}>Export</button>
            <button style={{padding:'7px 18px',borderRadius:4,background:C.navy,color:'#fff',fontSize:11.5,fontWeight:700,border:'none',cursor:'pointer'}}>Save</button>
          </div>
        </div>

        {/* Table */}
        <div style={{border:`1px solid ${C.gray200}`,borderRadius:8,overflow:'hidden'}}>
          {/* Column Headers */}
          <div style={{display:'grid',gridTemplateColumns:'2fr 1.4fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr 0.4fr',
            padding:'9px 14px',background:C.gray50,borderBottom:`1px solid ${C.gray200}`,
            fontSize:10.5,fontWeight:800,color:C.gray400,textTransform:'uppercase',gap:4}}>
            <span onClick={()=>doSort('name')} style={{cursor:'pointer'}}>Name</span>
            <span onClick={()=>doSort('mcap')} style={{cursor:'pointer',textAlign:'right'}}>Mkt Cap {SortIcon({field:'mcap'})}</span>
            <span onClick={()=>doSort('price')} style={{cursor:'pointer',textAlign:'right'}}>Price {SortIcon({field:'price'})}</span>
            <span onClick={()=>doSort('pe')} style={{cursor:'pointer',textAlign:'right'}}>PE {SortIcon({field:'pe'})}</span>
            <span onClick={()=>doSort('roe')} style={{cursor:'pointer',textAlign:'right'}}>ROE% {SortIcon({field:'roe'})}</span>
            <span onClick={()=>doSort('de')} style={{cursor:'pointer',textAlign:'right'}}>D/E {SortIcon({field:'de'})}</span>
            <span onClick={()=>doSort('g3')} style={{cursor:'pointer',textAlign:'right'}}>3Y Gr% {SortIcon({field:'g3'})}</span>
            <span onClick={()=>doSort('dy')} style={{cursor:'pointer',textAlign:'right'}}>Div% {SortIcon({field:'dy'})}</span>
            <span style={{textAlign:'right'}}>RSI</span>
            <span></span>
          </div>

          {results.length===0?(
            <div style={{padding:48,textAlign:'center',color:C.gray400}}>
              <div style={{fontSize:28,marginBottom:8}}>🔍</div>
              No stocks match your filters. Try relaxing some conditions.
            </div>
          ):results.map((s,i)=>{
            const up = s.g3>=0
            return (
              <div key={s.sym} onClick={()=>onSelectStock&&onSelectStock(s.sym)}
                style={{display:'grid',gridTemplateColumns:'2fr 1.4fr 1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr 0.4fr',
                  padding:'12px 14px',borderBottom:`1px solid ${C.gray100}`,alignItems:'center',cursor:'pointer',transition:'background .1s',gap:4}}
                onMouseEnter={e=>e.currentTarget.style.background=C.gray50}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10.5,color:C.gray400,minWidth:18}}>{i+1}.</span>
                  <div style={{width:26,height:26,borderRadius:4,background:C.blueBg,color:C.blue,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,flexShrink:0}}>{s.sym.slice(0,2)}</div>
                  <div>
                    <div style={{fontSize:12,fontWeight:800,color:C.gray800,lineHeight:1.2}}>{s.name}</div>
                    <div style={{fontSize:10,color:C.gray400,fontFamily:'monospace'}}>{s.sym} · {s.cat}</div>
                  </div>
                </div>
                <div style={{textAlign:'right',fontSize:11.5,fontFamily:'monospace',fontWeight:700}}>{f2(s.mcap)} Cr</div>
                <div style={{textAlign:'right',fontSize:11.5,fontFamily:'monospace',fontWeight:700}}>₹{f2(s.price)}</div>
                <div style={{textAlign:'right',fontSize:11.5,fontFamily:'monospace',color:C.gray600}}>{s.pe.toFixed(1)}x</div>
                <div style={{textAlign:'right',fontSize:11.5,fontFamily:'monospace',color:s.roe>15?C.green:C.gray600,fontWeight:700}}>{s.roe.toFixed(1)}%</div>
                <div style={{textAlign:'right',fontSize:11.5,fontFamily:'monospace',color:s.de>2?C.red:C.gray600}}>{s.de.toFixed(2)}</div>
                <div style={{textAlign:'right',fontSize:11.5,fontFamily:'monospace',color:up?C.green:C.red,fontWeight:700}}>{up?'+':''}{s.g3.toFixed(1)}%</div>
                <div style={{textAlign:'right',fontSize:11.5,fontFamily:'monospace',color:s.dy>0?C.blue:C.gray400}}>{s.dy>0?`${s.dy.toFixed(1)}%`:'—'}</div>
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:10,fontWeight:800,padding:'2px 5px',borderRadius:4,
                    background:s.rsi>70?C.redBg:s.rsi<30?C.greenBg:C.gray100,
                    color:s.rsi>70?C.red:s.rsi<30?C.green:C.gray600}}>{s.rsi.toFixed(0)}</span>
                </div>
                <div style={{textAlign:'right'}}>
                  <button onClick={e=>{e.stopPropagation();setBm(b=>({...b,[s.sym]:!b[s.sym]}))}}
                    style={{background:'none',border:'none',cursor:'pointer',color:bm[s.sym]?C.blue:C.gray400}}>
                    {bm[s.sym]?<BookmarkCheck size={14}/>:<Bookmark size={14}/>}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{marginTop:12,fontSize:11.5,color:C.gray400,textAlign:'center'}}>
          {results.length} results · Click any row to open Trading Terminal · Data sourced from NSE/BSE
        </div>
      </div>
    </div>
  )
}
