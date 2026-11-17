import './style.css';
import {mountWater} from './modules/water/entry';
mountWater(document.querySelector('#ui')!,document.querySelector('#world')!);
